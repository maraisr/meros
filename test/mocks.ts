// @ts-nocheck

import type { IncomingMessage } from 'http';

type Part = string;

export const wrap = (boundary: string) => `\r\n--${boundary.replace(/['"]/g, '')}\r\n`;
export const tail = (boundary: string) => `\r\n--${boundary.replace(/['"]/g, '')}--\r\n`;
export const preamble = () => 'preamble';

export const makePart = (payload: any, headers: string = []): Part => {
	const returns = [
		`content-type: ${
			typeof payload === 'string' ? 'text/plain' : 'application/json'
		}`,
		...headers,
		'',
		Buffer.from(
			typeof payload === 'string' ? payload : JSON.stringify(payload),
			'utf8',
		),
	];

	return returns.join('\r\n');
};

export const splitString = (str: Part, count: number): string[] => {
	const length = str.length,
		chunks = new Array(count),
		chars = Math.floor(length / count);
	for (let f = 0, n = chars, i = 0; i < count; i++) {
		chunks[i] = str.slice(f, i === count - 1 ? undefined : n);
		f = n;
		n = f + chars;
	}
	return chunks;
};

const processChunk = (chunk: string[], boundary: string) => {
	return Buffer.from(
		chunk
			.map((v) => {
				if (typeof v === 'function') v = v(boundary);
				return v;
			})
			.join(''),
	);
};

export async function mockResponseNode<T>(
	chunks: AsyncIterableIterator<T>,
	boundary: string,
): Promise<IncomingMessage> {
	return {
		headers: {
			'content-type': `multipart/mixed; boundary=${boundary}`,
			'Content-Type': `multipart/mixed; boundary=${boundary}`,
		},
		[Symbol.asyncIterator]: async function* () {
			for await (let chunk of chunks) {
				yield processChunk(chunk, boundary);
			}
		},
	};
}

export async function mockResponseBrowser<T>(
	chunks: AsyncIterableIterator<T>,
	boundary: string,
): Promise<Response> {
	return {
		headers: new Map([
			['content-type', `multipart/mixed; boundary=${boundary}`],
			['Content-Type', `multipart/mixed; boundary=${boundary}`],
		]),
		status: 200,
		body: {
			getReader() {
				return {
					async read() {
						const { value: chunk, done } = await chunks.next();
						return {
							value: chunk
								? processChunk(chunk, boundary)
								: undefined,
							done,
						};
					},
					releaseLock() {
						// nothing
					},
				};
			},
		},
		ok: true,
		bodyUsed: false,
	};
}
