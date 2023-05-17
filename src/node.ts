import type { IncomingMessage } from 'node:http';
import type { Readable } from 'node:stream';

import type { Options, Part } from 'meros';
import type { Arrayable } from './shared';

async function* generate<T>(
	stream: Readable,
	boundary: string,
	options?: Options,
): AsyncGenerator<Arrayable<Part<T, Buffer>>> {
	const is_eager = !options || !options.multiple;

	let len_boundary = Buffer.byteLength(boundary);
	let buffer = Buffer.alloc(0);
	let is_preamble = true;
	let payloads = [];

	outer: for await (const chunk of stream) {
		const idx_chunk = (chunk as Buffer).indexOf(boundary);
		let idx_boundary = buffer.byteLength;

		buffer = Buffer.concat([buffer, chunk]);

		if (!!~idx_chunk) {
			// chunk itself had `boundary` marker
			idx_boundary += idx_chunk;
		} else {
			// search combined (boundary can be across chunks)
			idx_boundary = buffer.indexOf(boundary);
		}

		payloads = [];
		while (!!~idx_boundary) {
			const current = buffer.slice(0, idx_boundary);
			const next = buffer.slice(idx_boundary + len_boundary);

			if (is_preamble) {
				is_preamble = false;
				boundary = '\r\n' + boundary;
				len_boundary += 2;
			} else {
				const headers: Record<string, string> = {};
				const idx_headers = current.indexOf('\r\n\r\n') + 4; // 4 -> '\r\n\r\n'.length
				const arr_headers = String(buffer.slice(0, idx_headers))
					.trim()
					.split('\r\n');

				// parse headers
				let tmp;
				while (tmp = arr_headers.shift()) {
					tmp = tmp.split(': ');
					headers[tmp.shift()!.toLowerCase()] = tmp.join(': ');
				}

				const last_idx = current.lastIndexOf('\r\n', idx_headers);

				let body: T | Buffer = current.slice(idx_headers, last_idx > -1 ? undefined : last_idx);
				let is_json = false;

				tmp = headers['content-type'];
				if (tmp && !!~tmp.indexOf('application/json')) {
					try {
						body = JSON.parse(String(body)) as T;
						is_json = true;
					} catch (_) {
					}
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
	const ctype = response.headers['content-type'];
	if (!ctype || !~ctype.indexOf('multipart/mixed')) return response;

	const idx_boundary = ctype.indexOf('boundary=');
	let boundary = '-';
	if (!!~idx_boundary) {
		const idx_boundary_len = idx_boundary + 9; // +9 for 'boundary='.length
		const eo_boundary = ctype.indexOf(';', idx_boundary_len); // strip any parameter

		boundary = ctype
			.slice(
				idx_boundary_len,
				eo_boundary > -1 ? eo_boundary : undefined,
			)
			.trim()
			.replace(/"/g, '');
	}

	return generate<T>(response, `--${boundary}`, options);
}
