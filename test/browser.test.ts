import { meros } from '../src/browser';
import type { Chunk } from './utils';

import suites from './suites';

function response(
	chunks: readonly Chunk[],
	boundary = '-',
	headers?: Record<string, string>,
) {
	const stream = (async function* () {
		for (const chunk of chunks) yield Buffer.from(chunk);
	})();

	return {
		ok: true,
		bodyUsed: false,
		headers: new Map(
			Object.entries({
				'content-type': `multipart/mixed; boundary=${boundary}`,
				...headers,
			}),
		),
		body: {
			getReader: () => ({
				read: () => stream.next(),
				cancel() {},
			}),
		},
	};
}

suites(meros, response);
