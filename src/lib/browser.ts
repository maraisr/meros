const separator = '\r\n\r\n';
const decoder = new TextDecoder;

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
			if (result.done) break outer; // undefined value

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

			while (!!~idx_boundary) {
				const current = buffer.substring(0, idx_boundary);
				const next = buffer.substring(idx_boundary + boundary.length);

				if (is_preamble) {
					is_preamble = false;
				} else {
					let ctype = '';
					const idx_headers = current.indexOf(separator);

					// parse headers, only keeping relevant headers
					buffer.substring(0, idx_headers).trim().split(/\r\n/).forEach((str, idx) => {
						idx = str.indexOf(':');
						let key = str.substring(0, idx).toLowerCase();
						if (key === 'content-type') ctype = str.substring(idx + 1).trim();
					});

					let payload = current.substring(idx_headers + separator.length, current.lastIndexOf('\r\n'));

					is_json = ctype ? !!~ctype.indexOf('application/json') : is_json;
					yield is_json ? JSON.parse(payload) : payload;

					if (next.substring(0, 2) === '--') break outer;
				}

				buffer = next;
				last_index = 0;
				idx_boundary = buffer.indexOf(boundary);
			}
		}
	} finally {
		reader.releaseLock();
	}
}
