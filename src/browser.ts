import { generate } from './lib/browser';
import type { Options } from 'meros';

export async function meros<T = object>(response: Response, options?: Options) {
	if (!response.ok || !response.body || response.bodyUsed) return response;

	const ctype = response.headers.get('content-type');
	if (!ctype || !~ctype.indexOf('multipart/mixed')) return response;

	const idx_boundary = ctype.indexOf('boundary=');

	return generate<T>(
		response.body,
		`--${!!~idx_boundary
			? // +9 for 'boundary='.length
			ctype.substring(idx_boundary + 9).trim().replace(/['"]/g, '')
			: '-'}`,
		options,
	);
}
