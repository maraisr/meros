import { generate } from './lib/browser';

/**
 * Yield immediately for every part made available on the response. If the `content-type` of the response isn't a
 * multipart body, then we'll resolve with {@link Response}.
 *
 * @example
 *
 * ```js
 * const parts = await fetch('/fetch-multipart')
 *      .then(meros);
 *
 * const parts = await meros(response);
 *
 * for await (const part of parts) {
 *     // do something with this part
 * }
 * ```
 */
export async function meros<T=unknown>(response: Response) {
	if (!response.ok || !response.body || response.bodyUsed) {
		// @ts-ignore
		return;
	}

	const ctype = response.headers.get('content-type');

	if (!ctype) throw new Error('There was no content-type header');
	if (!/multipart\/mixed/.test(ctype)) return response;

	const idx_boundary = ctype.indexOf('boundary=');

	return generate<T>(
		response.body,
		`--${!!~idx_boundary
			? // +9 for 'boundary='.length
			ctype.substring(idx_boundary + 9).trim()
			: '-'}`,
	);
}
