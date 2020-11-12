import type { IncomingMessage } from 'http';
import { generate } from './lib/node';

/**
 * Yield immediately for every part made available on the response. If the `content-type` of the response isn't a
 * multipart body, then we'll resolve with {@link IncomingMessage}.
 *
 * @example
 *
 * ```js
 * const response = await new Promise((resolve) => {
 *   const request = http.get(`http://my-domain/mock-ep`, (response) => {
 *   	resolve(response);
 *   });
 *   request.end();
 * });
 *
 * const parts = await meros(response);
 *
 * for await (const part of parts) {
 *     // do something with this part
 * }
 * ```
 */
export async function meros<T = unknown>(response: IncomingMessage) {
	const ctype = response.headers['content-type'];

	if (!ctype) throw new Error('There was no content-type header');
	if (!/multipart\/mixed/.test(ctype)) return response;

	const idx_boundary = ctype.indexOf('boundary=');

	return generate<T>(
		response,
		`--${!!~idx_boundary
			? // +9 for 'boundary='.length
			ctype.substring(idx_boundary + 9).trim().replace(/['"]/g, '')
			: '-'}`,
	);
}
