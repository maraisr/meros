import { generate } from './lib/node';

import type { IncomingMessage } from 'http';

export async function meros<T>(res: IncomingMessage) {
	const ctype = res.headers['content-type'];

	if (!ctype) throw new Error('There was no content-type header');
	if (!/multipart\/mixed/.test(ctype)) return res;

	const idx_boundary = ctype.indexOf('boundary=');

	return generate<T>(
		res,
		'--' +
			(!!~idx_boundary
				? // +9 for 'boundary='.length
				  ctype.substring(idx_boundary + 9).trim()
				: '-'),
	);
}
