import { meros } from '../src/node';
import type { Chunk } from './utils';

import suites from './suites';

function response(
	chunks: readonly Chunk[],
	boundary = '-',
	headers?: Record<string, string>,
) {
	return {
		headers: {
			'content-type': `multipart/mixed; boundary=${boundary}`,
			...headers,
		},
		async *[Symbol.asyncIterator]() {
			for (const chunk of chunks) yield Buffer.from(chunk);
		},
	};
}

suites(meros, response);
