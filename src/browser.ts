import { generate } from './lib/browser';
import type { Arrayable, Options, Part } from './lib/types';

export function meros<T=object>(response: Response, options: { multiple: true }): Promise<Response | AsyncGenerator<ReadonlyArray<Part<T, Buffer>>>>;
export function meros<T=object>(response: Response, options?: { multiple: false }): Promise<Response | AsyncGenerator<Part<T, Buffer>>>;
export function meros<T=object>(response: Response, options?: Options): Promise<Response | AsyncGenerator<Arrayable<Part<T, Buffer>>>>;

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
 * for await (const part of parts) {
 *     // do something with this part
 * }
 * ```
 */
export async function meros<T=object>(response: Response, options?: Options) {
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
		options
	);
}
