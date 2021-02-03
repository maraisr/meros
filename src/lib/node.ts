import type { Readable } from 'stream';
import type { Options, Part, Arrayable } from './types';

const separator = '\r\n\r\n';

export async function* generate<T>(
	stream: Readable,
	boundary: string,
	options?: Options
): AsyncGenerator<Arrayable<Part<T, Buffer>>> {
	const len_boundary = Buffer.byteLength(boundary),
		is_eager = !options || !options.multiple;

	let last_index = 0;
	let buffer = Buffer.alloc(0);
	let is_preamble = true;

	outer: for await (const chunk of stream) {
		let idx_boundary = buffer.length;
		buffer = Buffer.concat([buffer, chunk]);
		const idx_chunk = (chunk as Buffer).indexOf(boundary);

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
			const current = buffer.slice(0, idx_boundary);
			const next = buffer.slice(idx_boundary + len_boundary);

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

				let body: T | Buffer = current.slice(idx_headers + separator.length, current.lastIndexOf('\r\n'));
				let is_json = false;

				tmp = headers['content-type'];
				if (tmp && !!~tmp.indexOf('application/json')) {
					try {
						body = JSON.parse(body.toString()) as T;
						is_json = true;
					} catch (_) {
					}
				}

				tmp = { headers, body, json: is_json };
				is_eager ? yield tmp : payloads.push(tmp);

				// hit a tail boundary, break
				if (next.slice(0, 2).toString() === '--') break outer;
			}

			buffer = next;
			last_index = 0;
			idx_boundary = buffer.indexOf(boundary);
		}

		if (payloads.length) {
			yield payloads;
		}
	}
}
