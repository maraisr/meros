const BOUNDARY = '\r\n---\r\n';
const TAIL_BOUNDARY = '\r\n-----\r\n';
const CHUNK_DELIM = '\r\n\r\n';

type PART = object; // The JSON part object

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export async function* fetchMultipart(
	fetcher: () => Promise<Response>,
): AsyncGenerator {
	const response = await fetcher();

	if (!response?.body || !response?.ok) throw response;

	if (!response.headers.get('Content-Type').includes('multipart/mixed'))
		return response.json();

	const reader = response.body.getReader();

	try {
		let nextChunk = '';
		// Read initial values
		let { value: currentValue, done } = await reader.read();

		while (!done) {
			nextChunk += decoder.decode(currentValue);

			const parts = processChunk(nextChunk);

			// iterate and emit each processed part
			let part;
			while ((part = parts.next())) {
				if (!part.done) {
					yield part.value;
				} else {
					nextChunk = part.value ?? nextChunk;
					break;
				}
			}

			// Read next values
			({ value: currentValue, done } = await reader.read());
		}
	} finally {
		reader.releaseLock();
	}
}

function* processChunk(chunk: string): Generator<PART | string> {
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
