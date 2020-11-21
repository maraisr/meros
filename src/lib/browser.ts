type Part<T> =
	| { json: true, headers: Record<string, string>, body: T }
	| { json: false, headers: Record<string, string>, body: string };

const decoder = new TextDecoder;
const encoder = new TextEncoder;
const separator = encoder.encode('\r\n\r\n');

function indexOf(buffer: Uint8Array, needle: Uint8Array, last_index: number=0): [from: number, to: number] | null {
	let i, j = 0;
	outer: for (i = last_index; i < buffer.length; i++) {
		if (buffer[i] !== needle[0]) continue;
		for (j = 1; j < needle.length; j++) {
			if (needle[j] !== buffer[j + i]) continue outer;
		}
		return [i, i + j + 1];
	}
	return [-1, 0];
}

function concat(a: Uint8Array, b: Uint8Array) {
	const res = new Uint8Array(a.length + b.length);
	res.set(a);
	res.set(b, a.length);
	return res;
}

export async function* generate<T>(
	stream: ReadableStream<Uint8Array>,
	boundary: string,
): AsyncGenerator<Part<T>> {
	const reader = stream.getReader();
	let buffer:Uint8Array;
	let last_index, idx_chunk = 0;
	let is_preamble = true;
	const buf_boundary = encoder.encode(boundary);

	try {
		let result: ReadableStreamReadResult<Uint8Array>;
		outer: while (!(result = await reader.read()).done) {
			const chunk = result.value;

			[idx_chunk] = indexOf(chunk, buf_boundary);

			if (buffer) buffer = concat(buffer, chunk);
			else buffer = chunk;

			let idx_boundary = buffer.length;

			if (!!~idx_chunk) {
				// chunk itself had `boundary` marker
				idx_boundary += idx_chunk;
			} else {
				// search combined (boundary can be across chunks)
				[idx_boundary] = indexOf(buffer, buf_boundary, last_index);

				if (!~idx_boundary) {
					// rewind a bit for next `indexOf`
					last_index = buffer.length - chunk.length;
					continue;
				}
			}

			while (!!~idx_boundary) {
				const current = buffer.subarray(0, idx_boundary);
				const next = buffer.subarray(idx_boundary + buf_boundary.length);

				console.log('~>', JSON.stringify({
					buffer: decoder.decode(buffer).toString(),
					bufferX: decoder.decode(buffer.subarray(idx_boundary, idx_boundary+1)).toString(),
					idx_boundary,
					current: decoder.decode(current).toString(),
					next: decoder.decode(next).toString(),
					is_preamble
				}, null, 4));

				if (is_preamble) {
					is_preamble = false;
				} else {
					const headers: Record<string, string> = {};
					const [idx_headers, last_idx_headers] = indexOf(current, separator);
					const arr_headers = buffer.subarray(0, idx_headers).toString().trim().split(/\r\n/);

					// parse headers
					let tmp;
					while (tmp = arr_headers.shift()) {
						tmp = tmp.split(': ');
						headers[tmp.shift().toLowerCase()] = tmp.join(': ');
					}

					let body = current.subarray(last_idx_headers);
					let is_json = false;

					tmp = headers['content-type'];
					if (tmp && !!~tmp.indexOf('application/json')) {
						tmp = decoder.decode(body);
						try {
							body = JSON.parse(tmp);
							is_json = true;
						} catch (_) {
						}
					}

					// @ts-ignore
					yield { headers, body, json: is_json };

					const next_two =next.subarray(0, 2);
					console.log({ next_two });
					// next_two === '--'
					if (next_two[0] === 45 && next_two[1] === 45) break outer;
				}

				buffer = next;
				last_index = 0;
				[idx_boundary] = indexOf(buffer, buf_boundary);
			}
		}
	} finally {
		reader.releaseLock();
	}
}
