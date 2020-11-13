const separator = '\r\n\r\n';
const decoder = new TextDecoder;
const encoder = new TextEncoder;

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
			console.log('NEW CHUNK');

			const chunk = decoder.decode(result.value);
			const idx_chunk = chunk.indexOf(boundary);
			let idx_boundary = buffer.length;
			buffer += chunk;

			console.log(
				JSON.stringify({
					buffer: buffer.toString(),
					idx_chunk: idx_chunk.toString(),
					chunk: chunk.toString(),
				}, null, 2)
			);

			if (!!~idx_chunk) {
				// chunk itself had `boundary` marker
				idx_boundary += idx_chunk;
				console.log('>> HAD');
			} else {
				// search combined (boundary can be across chunks)
				idx_boundary = buffer.indexOf(boundary, last_index);

				if (!~idx_boundary) {
					console.log('>> MISS');
					// rewind a bit for next `indexOf`
					last_index = buffer.length - chunk.length;
					continue;
				}
			}

			while (!!~idx_boundary) {
				console.log('~>> LOOP', idx_boundary);
				let current = buffer.substring(0, idx_boundary);
				let next = buffer.substring(idx_boundary + boundary.length);
				if (current === '\r\n') {
					console.log('>> SWAP');
					idx_boundary = next.indexOf(boundary),
					current = next.substring(0, idx_boundary);
					next = next.substring(idx_boundary + boundary.length);
				}

				console.log(
					JSON.stringify({
						is_preamble: is_preamble,
						buffer: buffer.toString(),
						idx_boundary: idx_boundary.toString(),
						current: current.toString(),
						next: next.toString(),
					}, null, 2)
				);

				if (is_preamble) {
					console.log('>> SKIP PREAMBLE');
					//
				} else {
					let ctype = '', clength = '';

					const idx_headers = current.indexOf(separator);
					console.log('>> ', { idx_headers });
					if (!~idx_headers) continue outer;

					// parse headers, only keeping relevant headers
					buffer.substring(0, idx_headers).trim().split('\r\n').forEach((str, idx) => {
						idx = str.indexOf(':');
						let key = str.substring(0, idx).toLowerCase();
						if (key === 'content-type') ctype = str.substring(idx + 1).trim();
						else if (key === 'content-length') clength = str.substring(idx + 1).trim();
					});

					let payload = current.substring(idx_headers + separator.length);

					is_json = ctype ? !!~ctype.indexOf('application/json') : is_json;

					if (clength) {
						const num = parseInt(clength, 10);
						const arr = encoder.encode(payload);
						payload = decoder.decode(arr.subarray(0, num));
					}

					console.log('>> YIELD :: ', is_json, payload);
					yield is_json ? JSON.parse(payload) : payload;

					if (next.substring(0, 2) === '--') break outer;
				}

				buffer = next;
				last_index = 0;
				idx_boundary = is_preamble ? buffer.length : buffer.indexOf(boundary);
				is_preamble = false;

				console.log('>> LOOP END',
					JSON.stringify({
						buffer: buffer.toString(),
						idx_boundary: idx_boundary,
					}, null, 2)
				);

			}
		}
	} finally {
		reader.releaseLock();
	}
}
