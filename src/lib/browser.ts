import type { Options, Part, Arrayable } from './types';

const separator = '\r\n\r\n';
const decoder = new TextDecoder;

export async function* generate<T>(
	stream: ReadableStream<Uint8Array>,
	boundary: string,
	options?: Options
): AsyncGenerator<Arrayable<Part<T, string>>> {
	const reader = stream.getReader();
	let buffer = '',
		last_index = 0,
		is_preamble = true,
		is_eager = !options || !options.multiple;

	try {
		let result: ReadableStreamReadResult<Uint8Array>;
		outer: while (!(result = await reader.read()).done) {
			const chunk = decoder.decode(result.value);
			const idx_chunk = chunk.indexOf(boundary);
			let idx_boundary = buffer.length;
			buffer += chunk;

			if (!!~idx_chunk) {
				// chunk itself had `boundary` marker
				idx_boundary += idx_chunk;
			} else {
				// search combined (boundary can be across chunks)
				idx_boundary = buffer.indexOf(boundary, last_index);

				if (!~idx_boundary) {
					// rewind a bit for next `indexOf`
					last_index = buffer.length - chunk.length;
					continue;
				}
			}

			const payloads = [];

			while (!!~idx_boundary) {
				const current = buffer.substring(0, idx_boundary);
				const next = buffer.substring(idx_boundary + boundary.length);

				if (is_preamble) {
					is_preamble = false;
				} else {
					const headers: Record<string, string> = {};
					const idx_headers = current.indexOf(separator);
					const arr_headers = buffer.slice(0, idx_headers).toString().trim().split(/\r\n/);

					// parse headers
					let tmp;
					while (tmp = arr_headers.shift()) {
						tmp = tmp.split(': ');
						headers[tmp.shift().toLowerCase()] = tmp.join(': ');
					}

					let body: T | string = current.substring(idx_headers + separator.length, current.lastIndexOf('\r\n'));
					let is_json = false;

					tmp = headers['content-type'];
					if (tmp && !!~tmp.indexOf('application/json')) {
						try {
							body = JSON.parse(body) as T;
							is_json = true;
						} catch (_) {
						}
					}

					tmp = { headers, body, json: is_json };
					is_eager ? yield tmp : payloads.push(tmp);

					// hit a tail boundary, break
					if (next.substring(0, 2) === '--') break outer;
				}

				buffer = next;
				last_index = 0;
				idx_boundary = buffer.indexOf(boundary);
			}

			if (payloads.length) {
				yield payloads;
			}
		}
	} finally {
		reader.releaseLock();
	}
}
