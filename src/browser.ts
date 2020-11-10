import { generate } from './lib/browser';

export async function meros<T>(res: Response) {
	if (!res.ok || !res.body || res.bodyUsed) {
		// @ts-ignore
		return;
	}

	const ctype = res.headers.get('content-type');

	if (!ctype) throw new Error('There was no content-type header');
	if (!/multipart\/mixed/.test(ctype)) return res;

	const idx_boundary = ctype.indexOf('boundary=');

	return generate<T>(
		res.body,
		'--' +
			(!!~idx_boundary
				? // +9 for 'boundary='.length
				ctype.substring(idx_boundary + 9).trim()
				: '-'),
	);
}
