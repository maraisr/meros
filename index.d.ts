export interface Options {
	/**
	 * Setting this to true will yield an array. In other words; instead of yielding once for every payload—we collect
	 * all complete payloads for a chunk and then yield.
	 *
	 * @default false
	 */
	multiple: boolean;
}

export type Part<Body, Fallback> =
	| { json: false; headers: Record<string, string>; body: Fallback }
	| { json: true; headers: Record<string, string>; body: Body };

type Dispose = () => void;

type Listener<T> = {
	next(part: T): void;
	error(error: unknown): void;
	complete(): void;
};

export type Observed<T> = {
	subscribe(listener: Listener<T>): { unsubscribe: Dispose };
};

export * from 'meros/browser';
export * from 'meros/node';
