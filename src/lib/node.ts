import type { Readable } from 'stream';

const separator = '\r\n\r\n';

export async function* generate<T>(
	stream: Readable,
	boundary: string,
): AsyncGenerator<T> {
	let last_index = 0;
	let buffer = Buffer.alloc(0);
	let is_preamble = true;
	let is_json = false;

	for await (const chunk of stream) {
		const idx_chunk = (chunk as Buffer).indexOf(boundary);

		let idx_boundary = buffer.length;
		buffer = Buffer.concat([buffer, chunk]);

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

		const next = buffer.slice(idx_boundary + boundary.length);
		const current = buffer.slice(0, idx_boundary);

		if (is_preamble) {
			buffer = next;
			is_preamble = false;
			continue;
		}

		let ctype = '', clength = '';
		const idx_headers = current.indexOf(separator);

		// parse headers, only keeping relevant headers
		buffer.slice(0, idx_headers).toString('utf8').trim().split(/\r\n/).forEach((str, idx) => {
			idx = str.indexOf(':');
			let key = str.substring(0, idx).toLowerCase();
			if (key === 'content-type') ctype = str.substring(idx + 1).trim();
			else if (key === 'content-length') clength = str.substring(idx + 1).trim();
		});

		let payload = current.slice(idx_headers + separator.length);
		if (clength) payload = payload.slice(0, parseInt(clength, 10));

		is_json = ctype === '' ? is_json : !!~ctype.indexOf('application/json');

		yield is_json
			? JSON.parse(payload.toString('utf8'))
			: payload.toString('utf8');

		if (next.slice(0, 2).toString() === '--') break;

		buffer = next;
		last_index = 0;
	}
}
