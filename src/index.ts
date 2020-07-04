const BOUNDARY = '\r\n---\r\n';
const TAIL_BOUNDARY = '\r\n-----\r\n';
const CHUNK_DELIM = '\r\n\r\n';

type PART = object; // The JSON part object

export async function* fetchMultipart(
	fetcher: () => Promise<Response>,
): AsyncGenerator {
	const response = await fetcher();

	if (!response || !response.body || !response.ok) throw response;

	if (!response.headers.get('Content-Type').includes('multipart/mixed'))
		return await response.json();

	const reader = response.body.getReader();

	const decoder = new TextDecoder();

	try {
		let trackingBuffer = '';

		while (true) {
			const { value, done } = await reader.read();
			if (done) return;

			const chunk = decoder.decode(value);

			trackingBuffer += chunk;

			const parts = processChunk(trackingBuffer);
			let part;
			while ((part = parts.next())) {
				if (!part.done) yield part.value;
				if (part.done && part.value !== undefined) {
					trackingBuffer = part.value;
				}
				if (part.done) break;
			}
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
		const contentLengthHeader = headers
			.split('\r\n')
			.find((line) => line.toLowerCase().indexOf('content-length:') >= 0);
		if (contentLengthHeader === undefined)
			throw new Error('No Content-Length header found');
		const contentLength = parseInt(
			contentLengthHeader.split(':').pop(),
			10,
		);
		if (isNaN(contentLength))
			throw new Error('Failed parsing Content-Length');

		const textBufferInt = new TextEncoder().encode(
			rest.replace(TAIL_BOUNDARY, ''),
		);

		if (textBufferInt.length < contentLength) return chunk;

		const body = new TextDecoder().decode(
			textBufferInt.subarray(0, contentLength),
		);

		yield JSON.parse(body);

		buffer = new TextDecoder().decode(
			textBufferInt.subarray(contentLength),
		);
	}
}

const shiftBuffer = (buffer: string, delim: string): [string, string] => {
	const index = buffer.indexOf(delim);
	if (index < 0) return [buffer, undefined];
	return [buffer.substring(0, index), buffer.substring(index + delim.length)];
};
