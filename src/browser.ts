import type { Options, Part } from 'meros';

import type { Arrayable } from './shared';

let decoder = new TextDecoder();

async function* generate<T>(
	stream: ReadableStream<Uint8Array>,
	boundary: string,
	options?: Options,
): AsyncGenerator<Arrayable<Part<T, string>>> {
	let reader = stream.getReader();
	let is_eager = !options || !options.multiple;

	let len_boundary = boundary.length;
	let buffer = '';
	let payloads = [];
	let idx_boundary;
	let in_main;
	let tmp;

	try {
		let result: ReadableStreamReadResult<Uint8Array>;
		outer: while (!(result = await reader.read()).done) {
			let chunk = decoder.decode(result.value);

			idx_boundary = buffer.length;
			buffer += chunk;

			let idx_chunk = chunk.indexOf(boundary);
			// if the chunk has a boundary, simply use it
			!!~idx_chunk
				? (idx_boundary += idx_chunk)
				: // if not lets search for it in our current buffer
				  (idx_boundary = buffer.indexOf(boundary));

			payloads = [];
			while (!!~idx_boundary) {
				let current = buffer.slice(0, idx_boundary);
				let next = buffer.slice(idx_boundary + len_boundary);

				if (!in_main) {
					boundary = '\r\n' + boundary;
					in_main = len_boundary += 2;
				} else {
					let idx_headers = current.indexOf('\r\n\r\n') + 4; // 4 -> '\r\n\r\n'.length
					let last_idx = current.lastIndexOf('\r\n', idx_headers);

					let is_json = false;
					let body: T | string = current.slice(
						idx_headers,
						last_idx > -1 ? undefined : last_idx,
					);

					let arr_headers = String(current.slice(0, idx_headers))
						.trim()
						.split('\r\n');

					let headers: Record<string, string> = {};
					let len = arr_headers.length;
					for (
						;
						(tmp = arr_headers[--len]);
						tmp = tmp.split(': '),
							headers[tmp.shift()!.toLowerCase()] = tmp.join(': ')
					);

					tmp = headers['content-type'];
					if (tmp && !!~tmp.indexOf('application/json')) {
						try {
							body = JSON.parse(body) as T;
							is_json = true;
						} catch (_) {}
					}

					tmp = { headers, body, json: is_json } as Part<T, string>;
					is_eager ? yield tmp : payloads.push(tmp);

					// hit a tail boundary, break
					if ('--' === next.slice(0, 2)) break outer;
				}

				buffer = next;
				idx_boundary = buffer.indexOf(boundary);
			}

			if (payloads.length) yield payloads;
		}
	} finally {
		if (payloads.length) yield payloads;
		await reader.cancel();
	}
}

export async function meros<T = object>(response: Response, options?: Options) {
	if (!response.ok || !response.body || response.bodyUsed) return response;

	let ctype = response.headers.get('content-type');
	if (!ctype || !~ctype.indexOf('multipart/')) return response;

	let idx_boundary = ctype.indexOf('boundary=');
	let boundary = '-';
	if (!!~idx_boundary) {
		let idx_boundary_len = idx_boundary + 9; // +9 for 'boundary='.length
		let eo_boundary = ctype.indexOf(';', idx_boundary_len); // strip any parameter

		boundary = ctype
			.slice(idx_boundary_len, eo_boundary > -1 ? eo_boundary : undefined)
			.trim()
			.replace(/"/g, '');
	}

	return generate<T>(response.body, `--${boundary}`, options);
}
