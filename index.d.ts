/// <reference types="node" />
import { IncomingMessage } from 'http';

type Part<Body, Fallback> =
	| { json: true, headers: Record<string, string>, body: Body }
	| { json: false, headers: Record<string, string>, body: Fallback };

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
declare function meros<T = object>(response: Response): Promise<Response | AsyncGenerator<Part<T, string>>>;

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
declare function meros<T = object>(response: IncomingMessage): Promise<IncomingMessage | AsyncGenerator<Part<T, Buffer>>>;

export { meros };
