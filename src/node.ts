import type { IncomingMessage } from 'node:http';
import type { Readable } from 'node:stream';

import type { Options, Part } from 'meros';
import type { Arrayable } from './shared';

async function* generate<T>(
	stream: Readable,
	boundary: string,
	options?: Options,
): AsyncGenerator<Arrayable<Part<T, Buffer>>> {
	let is_eager = !options || !options.multiple;

	let len_boundary = Buffer.byteLength(boundary);
	let buffer = Buffer.alloc(0);
	let payloads = [];
	let idx_boundary;
	let in_main;
	let tmp;

	outer: for await (let chunk of stream) {
		idx_boundary = buffer.byteLength;
		buffer = Buffer.concat([buffer, chunk]);

		let idx_chunk = (chunk as Buffer).indexOf(boundary);
		// if the chunk has a boundary, simply use it
		!!~idx_chunk
			? (idx_boundary += idx_chunk)
			: // if not lets search for it in our current buffer
			  (idx_boundary = buffer.indexOf(boundary));

		payloads = [];
		while (!!~idx_boundary) {
			let current = buffer.subarray(0, idx_boundary);
			let next = buffer.subarray(idx_boundary + len_boundary);

			if (!in_main) {
				boundary = '\r\n' + boundary;
				in_main = len_boundary += 2;
			} else {
				let idx_headers = current.indexOf('\r\n\r\n') + 4; // 4 -> '\r\n\r\n'.length
				let last_idx = current.lastIndexOf('\r\n', idx_headers);

				let is_json = false;
				let body: T | Buffer = current.subarray(
					idx_headers,
					last_idx > -1 ? undefined : last_idx,
				);

				let arr_headers = String(current.subarray(0, idx_headers))
					.trim()
					.split('\r\n');

				let headers: Record<string, string> = {};
				let len = arr_headers.length;
				for (
					;
					(tmp = arr_headers[--len]);
					tmp = tmp.split(': '), headers[tmp.shift()!.toLowerCase()] = tmp.join(': ')
				);

				tmp = headers['content-type'];
				if (tmp && !!~tmp.indexOf('application/json')) {
					try {
						body = JSON.parse(String(body)) as T;
						is_json = true;
					} catch (_) {}
				}

				tmp = { headers, body, json: is_json } as Part<T, Buffer>;
				is_eager ? yield tmp : payloads.push(tmp);

				// hit a tail boundary, break
				if (next[0] === 45 && next[1] === 45) break outer;
			}

			buffer = next;
			idx_boundary = buffer.indexOf(boundary);
		}

		if (payloads.length) yield payloads;
	}

	if (payloads.length) yield payloads;
}

export async function meros<T = object>(response: IncomingMessage, options?: Options) {
	let ctype = response.headers['content-type'];
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

	return generate<T>(response, `--${boundary}`, options);
}
