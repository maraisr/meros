import type { Readable } from 'stream';

const separator = '\r\n\r\n';

export async function* generate<T>(
	stream: Readable,
	boundary: string,
): AsyncGenerator<T> {
	let buffer = Buffer.alloc(0);
	let isPreamble = true;
	let isJson = false;

	for await (const chunk of stream) {
		buffer = Buffer.concat([buffer, chunk], buffer.length + chunk.length);
		const boundaryIndex = buffer.indexOf(boundary);
		if (!~boundaryIndex) continue;

		if (isPreamble) {
			buffer = buffer.slice(boundaryIndex + boundary.length);
			isPreamble = false;
			continue;
		}

		const payload = buffer.slice(0, boundaryIndex);
		const headerSeparated = payload.indexOf(separator);
		let data = payload.slice(headerSeparated);

		const headers: Map<string, string> = new Map();
		for (let item of payload
			.slice(0, headerSeparated)
			.toString('utf8')
			.trim()
			.split(/\r\n/)) {
			const idx = item.indexOf(':');
			headers.set(
				item.slice(0, idx).toLowerCase(),
				item.slice(idx + 1).trim(),
			);
		}

		data = data.slice(data.indexOf(separator) + separator.length);

		const clength = headers.get('content-length');
		if (clength != null) {
			data = data.slice(0, parseInt(clength, 10));
		}

		if (!isJson) {
			isJson = !!~(headers.get('content-type') || '').indexOf(
				'application/json',
			);
		}

		yield isJson
			? JSON.parse(data.toString('utf8'))
			: data.toString('utf8');

		if (!!~buffer.indexOf(boundary + '--')) break;

		buffer = buffer.slice(boundaryIndex + boundary.length);
	}
}
