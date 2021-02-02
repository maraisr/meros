export type Part<Body, Fallback> =
	| { json: true, headers: Record<string, string>, body: Body }
	| { json: false, headers: Record<string, string>, body: Fallback };
