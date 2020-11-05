const BOUNDARY = '\r\n---\r\n';
const TAIL_BOUNDARY = '\r\n-----\r\n';
const CHUNK_DELIM = '\r\n\r\n';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export async function* fetchMultipart<Part extends object = {}>(
	fetcher: () => Promise<Response>,
): AsyncGenerator<Part> {
	const response = await fetcher();

	if (!response?.body || !response?.ok) throw response;

	if (!response.headers.get('Content-Type').includes('multipart/mixed')) {
		yield response.json();
		return;
	}

	const reader = response.body.getReader();

	try {
		let nextChunk = '';

		while (true) {
			const { value, done } = await reader.read();
			if (done) break;

			nextChunk += decoder.decode(value);

			const parts = processChunk(nextChunk);

			let part;
			while ((part = parts.next())) {
				if (!part.done) {
					yield part.value;
				} else {
					nextChunk = part.value ?? nextChunk;
					break;
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}

function* processChunk<T>(chunk: string): Generator<T | string> {
	if (chunk === TAIL_BOUNDARY) return '';

	let buffer = chunk;
	while (true) {
		const [, remainingParts] = shiftBuffer(buffer, BOUNDARY);

		// Bail out—we don't have anything meaningful
		if (!remainingParts?.length) return buffer;

		const [headers, rest] = shiftBuffer(remainingParts, CHUNK_DELIM);

		// Found no complete headers
		if (!rest?.length) return buffer;

		// Parse out the contentLength
		const contentLengthHeader = headers.match(/content-length: ?(\d+)/i);

		if (!contentLengthHeader)
			throw new Error('No Content-Length header found');

		const contentLength = parseInt(contentLengthHeader[1], 10);

		const textBufferInt = encoder.encode(rest.replace(TAIL_BOUNDARY, ''));

		if (textBufferInt.length < contentLength) return chunk;

		const body = decoder.decode(textBufferInt.subarray(0, contentLength));

		yield JSON.parse(body);

		buffer = decoder.decode(textBufferInt.subarray(contentLength));
	}
}

const shiftBuffer = (buffer: string, delim: string): [string, string] => {
	const index = buffer.indexOf(delim);
	return index < 0
		? [buffer, undefined]
		: [buffer.substring(0, index), buffer.substring(index + delim.length)];
};
