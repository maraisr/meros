import { generate } from './lib/node';

import type { IncomingMessage } from 'http';

export async function meros<T>(res: IncomingMessage) {
	const ctype = res.headers['content-type'];

	if (!ctype) throw new Error('There was no content-type header');
	if (!/multipart\/mixed/.test(ctype)) return res;

	const boundaryIndex = ctype.indexOf('boundary=');

	return generate<T>(
		res,
		'--' +
			(!!~boundaryIndex
				? // +9 for 'boundary='.length
				  ctype.substring(boundaryIndex + 9).trim()
				: '-'),
	);
}
