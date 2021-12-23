import type { IncomingMessage } from 'http';
import { generate } from './lib/node';
import type { Options, Part } from './lib/types';

export function meros<T=object>(response: IncomingMessage, options: { multiple: true }): Promise<IncomingMessage | AsyncGenerator<ReadonlyArray<Part<T, Buffer>>>>;
export function meros<T=object>(response: IncomingMessage, options?: { multiple: false }): Promise<IncomingMessage | AsyncGenerator<Part<T, Buffer>>>;
export function meros<T=object>(response: IncomingMessage, options?: Options): Promise<IncomingMessage | AsyncGenerator<Part<T, Buffer>>>;

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
export async function meros<T=object>(response: IncomingMessage, options?: Options) {
	const ctype = response.headers['content-type'];
	if (!ctype || !~ctype.indexOf('multipart/mixed')) return response;

	const idx_boundary = ctype.indexOf('boundary=');

	return generate<T>(
		response,
		`\r\n--${!!~idx_boundary
			? // +9 for 'boundary='.length
			ctype.substring(idx_boundary + 9).trim().replace(/['"]/g, '')
			: '-'}`,
		options
	);
}
