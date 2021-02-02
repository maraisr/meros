// export type Part<Body, Fallback> = { json: true; headers: Record<string, string>; body: Body };
// export type Part<Body, Fallback> = { json: false; headers: Record<string, string>; body: Fallback };
// export type Part<Body, Fallback> = { json: boolean; headers: Record<string, string>; body: Body | Fallback };

export type Part<Body, Fallback> =
	| { json: boolean; headers: Record<string, string>; body: Body | Fallback }
	| { json: false; headers: Record<string, string>; body: Fallback }
	| { json: true; headers: Record<string, string>; body: Body };

export interface Options {
	multiple: boolean;
}

export type Arrayable<T> = T | ReadonlyArray<T>;
