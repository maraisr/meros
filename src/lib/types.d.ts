export interface Options {
	multiple: boolean;
}

export type Part<Body, Fallback> =
	| { json: boolean; headers: Record<string, string>; body: Body | Fallback }
	| { json: false; headers: Record<string, string>; body: Fallback }
	| { json: true; headers: Record<string, string>; body: Body };

export type Arrayable<T> = T | ReadonlyArray<T>;
