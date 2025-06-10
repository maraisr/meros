// @ts-nocheck

import { makePushPullAsyncIterableIterator } from '@n1ru4l/push-pull-async-iterable-iterator';
import type { IncomingMessage } from 'http';

type Part = string;

export const wrap = (boundary: string) =>
	`\r\n--${boundary.replace(/['"]/g, '')}\r\n`;
export const tail = (boundary: string) =>
	`\r\n--${boundary.replace(/['"]/g, '')}--\r\n`;
export const preamble = () => 'preamble';

export const makePart = (
	payload: any,
	headers: string[] | boolean = [],
): Part => {
	if (headers === false) {
		headers = [];
	} else {
		if (!headers.includes('content-type'))
			(headers as string[]).unshift(
				`content-type: ${
					typeof payload === 'string'
						? 'text/plain'
						: 'application/json; charset=utf-8'
				}`,
			);
	}

	const returns = [
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

const processChunk = (chunk: string[] | Buffer, boundary: string) => {
	if (Array.isArray(chunk))
		return Buffer.from(
			chunk
				.map((v) => {
					if (typeof v === 'function') v = v(boundary);
					return v;
				})
				.join(''),
		);
	return chunk;
};

export async function mockResponseNode<T>(
	chunks: AsyncIterableIterator<T>,
	boundary: string,
	headers: Record<string, string> = {},
): Promise<IncomingMessage> {
	return {
		headers: {
			'content-type': `multipart/mixed; boundary=${boundary}`,
			'Content-Type': `multipart/mixed; boundary=${boundary}`,
			...headers,
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
	headers: Record<string, string> = {},
): Promise<Response> {
	const headrs = new Map([
		['content-type', `multipart/mixed; boundary=${boundary}`],
		['Content-Type', `multipart/mixed; boundary=${boundary}`],
	]);
	Object.entries(headers).forEach((key, value) => {
		headrs.set(key, value);
	});
	return {
		headers: headrs,
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
					cancel() {
						// nothing
					},
				};
			},
		},
		ok: true,
		bodyUsed: false,
	};
}

export type Meros = any;
export type Responder = any;

export const bodies = (parts: any[]) =>
	parts.map(({ body, json }) => (json ? body : String(body)));

export const test_helper = async (
	meros: Meros,
	responder: Responder,
	process: (v: any) => void,
	boundary = '-',
	headers?: Record<string, string>,
) => {
	const { asyncIterableIterator, pushValue } =
		makePushPullAsyncIterableIterator();
	const response = await responder(asyncIterableIterator, boundary, headers);

	const parts = await meros(response);
	const collection = [];

	await process(pushValue);

	for await (let part of parts) {
		collection.push(part);
	}

	return collection;
};
