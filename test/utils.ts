import type { IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';

interface ParsedPart {
	body: unknown;
	headers: Record<string, string>;
	json: boolean;
}

type ParsedValue = ParsedPart | ReadonlyArray<ParsedPart>;

type Chunk = string | Uint8Array;
type Meros<ResponseType> = (
	response: ResponseType,
	options?: { multiple: boolean },
) => Promise<ResponseType | AsyncGenerator<ParsedValue, void, unknown>>;
type Responder<ResponseType> = (
	chunks: ReadonlyArray<Chunk>,
	boundary: string,
	headers?: Record<string, string>,
) => ResponseType;

interface ResponseOptions {
	boundary?: string;
	headers?: Record<string, string>;
}

interface ParseOptions extends ResponseOptions {
	multiple?: boolean;
}

export const preamble = 'preamble';
export function delimiter(boundary = '-') {
	return `\r\n--${boundary.replace(/['"]/g, '')}\r\n`;
}

export function closingDelimiter(boundary = '-') {
	return `\r\n--${boundary.replace(/['"]/g, '')}--\r\n`;
}

export function chunk(...parts: string[]) {
	return parts.join('');
}

export function part(
	payload: unknown,
	headers: ReadonlyArray<string> | false = [],
): string {
	const partHeaders = headers === false ? [] : [...headers];

	if (
		headers !== false &&
		!partHeaders.some((header) => /^content-type\s*:/i.test(header))
	) {
		partHeaders.unshift(
			`content-type: ${
				typeof payload === 'string'
					? 'text/plain'
					: 'application/json; charset=utf-8'
			}`,
		);
	}

	const body =
		typeof payload === 'string' ? payload : JSON.stringify(payload);

	if (body === undefined) {
		throw new TypeError('Multipart payload must be JSON serializable');
	}

	return [...partHeaders, '', body].join('\r\n');
}

export function split(value: string, count: number): string[] {
	const chunkLength = Math.floor(value.length / count);

	return Array.from({ length: count }, (_, index) => {
		const start = index * chunkLength;
		const end = index === count - 1 ? undefined : start + chunkLength;
		return value.slice(start, end);
	});
}

function toBuffer(chunk: Chunk) {
	return Buffer.from(chunk);
}

function responseHeaders(
	boundary: string,
	headers: Record<string, string> = {},
): Record<string, string> {
	const result: Record<string, string> = {
		'content-type': `multipart/mixed; boundary=${boundary}`,
	};

	for (const [name, value] of Object.entries(headers)) {
		result[name.toLowerCase()] = value;
	}

	return result;
}

export function nodeResponse(
	chunks: ReadonlyArray<Chunk>,
	boundary: string,
	headers?: Record<string, string>,
): IncomingMessage {
	const response = Readable.from(chunks.map(toBuffer)) as IncomingMessage;
	response.headers = responseHeaders(boundary, headers);
	return response;
}

export function browserResponse(
	chunks: ReadonlyArray<Chunk>,
	boundary: string,
	headers?: Record<string, string>,
): Response {
	const readable = new ReadableStream<Uint8Array>({
		start(controller) {
			for (const chunk of chunks) {
				controller.enqueue(toBuffer(chunk));
			}

			controller.close();
		},
	});

	const values = responseHeaders(boundary, headers);

	return {
		body: readable,
		bodyUsed: false,
		headers: {
			get(name: string) {
				return values[name.toLowerCase()] ?? null;
			},
		},
		ok: true,
	} as Response;
}

function isParsedStream(
	value: unknown,
): value is AsyncGenerator<ParsedValue, void, unknown> {
	return (
		typeof value === 'object' &&
		value !== null &&
		Symbol.asyncIterator in value &&
		typeof value[Symbol.asyncIterator] === 'function' &&
		'next' in value &&
		typeof value.next === 'function'
	);
}

export function createTestContext<ResponseType>(
	meros: Meros<ResponseType>,
	responder: Responder<ResponseType>,
) {
	function parse(
		chunks: ReadonlyArray<Chunk>,
		options: ResponseOptions & { multiple: true },
	): Promise<AsyncGenerator<ReadonlyArray<ParsedPart>, void, unknown>>;
	function parse(
		chunks: ReadonlyArray<Chunk>,
		options?: ResponseOptions & { multiple?: false },
	): Promise<AsyncGenerator<ParsedPart, void, unknown>>;
	async function parse(
		chunks: ReadonlyArray<Chunk>,
		options: ParseOptions = {},
	): Promise<AsyncGenerator<ParsedValue, void, unknown>> {
		const boundary = options.boundary ?? '-';
		const response = responder(chunks, boundary, options.headers);
		const parts = await meros(
			response,
			options.multiple === undefined
				? undefined
				: { multiple: options.multiple },
		);

		if (!isParsedStream(parts)) {
			throw new TypeError('Expected a multipart response');
		}

		return parts;
	}

	const implementation: (...args: never[]) => unknown = meros;
	return { implementation, parse };
}

export type TestContext = ReturnType<typeof createTestContext>;

export async function collect<T>(
	source: AsyncIterable<T> | Promise<AsyncIterable<T>>,
): Promise<T[]> {
	const values = [];

	for await (const value of await source) {
		values.push(value);
	}

	return values;
}

export function bodies(parts: ReadonlyArray<ParsedPart>) {
	return parts.map(({ body, json }) => (json ? body : String(body)));
}
