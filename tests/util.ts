import { ReadableStream } from 'web-streams-polyfill';

export const makePart = (part: object): string => {
	const json = JSON.stringify(part);
	const payload = Buffer.from(json, 'utf8');

	return [
		'',
		'---',
		'Content-Type: application/json',
		`Content-Length: ${payload.length}`,
		'',
		payload,
		'',
	].join('\r\n');
};

export const mockFetch = (parts: any[]) => {
	return () => {
		return new Promise<Response>((resolve) => {
			const stream = new ReadableStream({
				start(controller) {
					for (const part of parts) {
						controller.enqueue(Buffer.from(part, 'utf8'));
					}

					controller.enqueue(Buffer.from('\r\n-----\r\n', 'utf8'));

					controller.close();
				},
			});

			resolve(
				// @ts-ignore
				new MockResponse(stream, {
					headers: {
						'Content-Type': 'multipart/mixed',
					},
				}),
			);
		});
	};
};

class MockResponse {
	constructor(private _body: ReadableStream, private _options: any) {}

	get json() {
		throw new Error('We dont have json in unit tests');
	}

	get status() {
		return 200;
	}

	get ok() {
		return true;
	}

	get headers() {
		return new Map(
			Object.entries(this._options.headers).reduce(
				(result, [key, value]) => [...result, [key, value]],
				[],
			),
		);
	}

	get body() {
		return this._body;
	}
}
