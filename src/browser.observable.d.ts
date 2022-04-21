import type { Options, Part, Observed } from 'meros';

/**
 * Subscribes to every part of a multi-part stream. If the `content-type` is that of a
 * multipart response. If not hen we'll resolve with {@link Response}.
 *
 * @example
 *
 * ```js
 * const parts = await fetch('/fetch-multipart')
 *      .then(meros);
 *
 * const subscription = parts
 *  .subscribe({
 *      next((part) => {
 *          // do something with this part
 *      }),
 *      error((error) => {
 *          // something bad happened
 *      }),
 *      complete(() => {
 *          // the stream has ended
 *      })
 *  });
 * 
 * subscription.unsubscribe(); // to end the subscription
 * ```
 */
export function meros<T = object>(response: Response, options: { multiple: true }): Promise<Response | Observed<ReadonlyArray<Part<T, string>>>>;
export function meros<T = object>(response: Response, options?: { multiple: false }): Promise<Response | Observed<Part<T, string>>>;
export function meros<T = object>(response: Response, options?: Options): Promise<Response | Observed<Part<T, string>>>;
