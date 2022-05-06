import type {Options, Part} from 'meros';
import {make} from './internal/consume.browser';

import type {Arrayable} from './shared';

async function* generate<T>(
	stream: ReadableStream<Uint8Array>,
	boundary: string,
	options?: Options,
): AsyncGenerator<Arrayable<Part<T, string>>> {
	const reader = stream.getReader();
	const is_eager = !options || !options.multiple;

	const consume = make(boundary, is_eager);

	try {
		let result: ReadableStreamDefaultReadResult<Uint8Array>;

		while (!(result = await reader.read()).done) {
			var payloads = yield* consume<Part<T, string>>(result);
			if (payloads === false) break;
			if (payloads && payloads.length) yield payloads;
		}

	} finally {
		if (payloads && payloads.length) yield payloads;
		reader.releaseLock();
	}
}

export async function meros<T = object>(response: Response, options?: Options) {
	if (!response.ok || !response.body || response.bodyUsed) return response;

	const ctype = response.headers.get('content-type');
	if (!ctype || !~ctype.indexOf('multipart/mixed')) return response;

	const idx_boundary = ctype.indexOf('boundary=');

	return generate<T>(
		response.body,
		`--${!!~idx_boundary
			? // +9 for 'boundary='.length
			ctype.substring(idx_boundary + 9).trim().replace(/['"]/g, '')
			: '-'}`,
		options,
	);
}
