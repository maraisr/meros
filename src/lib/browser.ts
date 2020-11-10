const decoder = new TextDecoder();

const separator = '\r\n\r\n';

export async function* generate<T>(
	stream: ReadableStream<Uint8Array>,
	boundary: string,
): AsyncGenerator<T> {
	const reader = stream.getReader();
	let buffer = '';
	let last_index = 0;
	let is_preamble = true;
	let is_json = true;

	try {
		while (true) {
			const result = await reader.read();
			const chunk =  decoder.decode(result.value);

			const idx_chunk = buffer.indexOf(boundary);
			let  idx_boundary = buffer.length;
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
			buffer.slice(0, idx_headers).toString().trim().split(/\r\n/).forEach((str, idx) => {
				idx = str.indexOf(':');
				let key = str.substring(0, idx).toLowerCase();
				if (key === 'content-type') ctype = str.substring(idx + 1).trim();
				else if (key === 'content-length') clength = str.substring(idx + 1).trim();
			});

			let payload = current.slice(idx_headers + separator.length);
			if (clength) payload = payload.slice(0, parseInt(clength, 10));

			is_json = is_json || !!~ctype.indexOf('application/json');

			yield is_json
				? JSON.parse(payload.toString())
				: payload.toString();

			if (result.done || next.slice(0, 2).toString() === '--') break;

			buffer = next;
			last_index = 0;
		}
	} finally {
		reader.releaseLock();
	}
}
