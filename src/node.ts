import { generate } from './lib/node';
import type { IncomingMessage } from 'http';
import type { Options } from 'meros';

export async function meros<T = object>(response: IncomingMessage, options?: Options) {
	const ctype = response.headers['content-type'];
	if (!ctype || !~ctype.indexOf('multipart/mixed')) return response;

	const idx_boundary = ctype.indexOf('boundary=');

	return generate<T>(
		response,
		`--${!!~idx_boundary
			? // +9 for 'boundary='.length
			ctype.substring(idx_boundary + 9).trim().replace(/['"]/g, '')
			: '-'}`,
		options,
	);
}
