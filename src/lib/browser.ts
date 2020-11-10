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
	let is_json = false;

	try {
		outer: while (true) {
			const result = await reader.read();
			const chunk = decoder.decode(result.value);

			let idx_boundary = buffer.length;
			const idx_chunk = chunk.indexOf(boundary);
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

			while (!!~idx_boundary) {
			const current = buffer.slice(0, idx_boundary);
				const next = buffer.slice(idx_boundary + boundary.length);

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
			// TODO: clength is in bytes which isnt the same as an index into array
			if (clength) payload = payload.slice(0, parseInt(clength, 10));

			is_json = ctype ? !!~ctype.indexOf('application/json') : is_json;
			yield is_json ? JSON.parse(payload.toString()) : payload.toString();

					if (result.done || next.slice(0, 2).toString() === '--') break outer;
				}

				buffer=next; last_index=0;
				idx_boundary = buffer.indexOf(boundary);
			}
		}
	} finally {
		reader.releaseLock();
	}
}
