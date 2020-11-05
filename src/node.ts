import type { IncomingMessage } from 'http';
import { generate } from './lib/node';

export async function meros<T>(res: IncomingMessage) {
	if (!('content-type' in res.headers)) {
		throw new Error('There was no content-type header');
	}

	if (!/multipart\/mixed/.test(res.headers['content-type'])) {
		return res;
	}

	const boundaryIndex = res.headers['content-type'].indexOf('boundary=');

	return generate<T>(
		res,
		'--' +
			(!!~boundaryIndex
				? res.headers['content-type']
						.substring(
							// +9 for 'boundary='.length
							boundaryIndex + 9,
						)
						.trim()
				: '-'),
	);
}
