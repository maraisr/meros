import type { Readable } from 'stream';

const separator = '\r\n\r\n';

export async function* generate<T>(
	stream: Readable,
	boundary: string,
): AsyncGenerator<T> {
	const len_boundary = Buffer.byteLength(boundary);

	let last_index = 0;
	let buffer = Buffer.alloc(0);
	let is_preamble = true;
	let is_json = false;

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

		while (!!~idx_boundary) {
			const current = buffer.slice(0, idx_boundary);
			const next = buffer.slice(idx_boundary + len_boundary);

			if (is_preamble) {
				is_preamble = false;
			} else {
				let ctype = '', clength = '';
				const idx_headers = current.indexOf(separator);

				// parse headers, only keeping relevant headers
				buffer.slice(0, idx_headers).toString().trim().split(/\r\n/).forEach((str, idx) => {
					idx = str.indexOf(':');
					let key = str.substring(0, idx).toLowerCase();
					if (key === 'content-type') ctype = str.substring(idx + 1).trim();
					else if (key === 'content-length') clength = str.substring(idx + 1).trim();
				});

				let payload = current.slice(idx_headers + separator.length);
				if (clength) payload = payload.slice(0, parseInt(clength, 10));

				is_json = ctype ? !!~ctype.indexOf('application/json'): is_json;

				yield is_json
					? JSON.parse(payload.toString())
					: payload.toString();

				if (next.slice(0, 2).toString() === '--') {
					break outer;
				}
			}

			buffer=next; last_index=0;
			idx_boundary = buffer.indexOf(boundary);
		}
	}
}
