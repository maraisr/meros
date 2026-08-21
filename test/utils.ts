export type Chunk = string | Uint8Array;
type Headers = Record<string, string>;

export type Meros = (
	response: any,
	options?: { multiple: boolean },
) => Promise<any>;

export type Responder = (
	chunks: readonly Chunk[],
	boundary?: string,
	headers?: Headers,
) => any;

export const preamble = 'preamble';
export function delimiter(boundary = '-') {
	return `\r\n--${boundary.replace(/['"]/g, '')}\r\n`;
}

export function closingDelimiter(boundary = '-') {
	return `\r\n--${boundary.replace(/['"]/g, '')}--\r\n`;
}

export function chunk(...parts: string[]) {
	return parts.join('');
}

// a part is the blank line that ends the header block, then the body —
// headers, when a test wants them, are written as literal lines before it
export function part(body: string) {
	return '\r\n' + body;
}

export function json(payload: unknown) {
	return (
		'content-type: application/json; charset=utf-8\r\n' +
		part(JSON.stringify(payload))
	);
}

export function split(value: string, count: number) {
	const size = Math.floor(value.length / count);

	return Array.from({ length: count }, (_, i) =>
		value.slice(i * size, i === count - 1 ? undefined : (i + 1) * size),
	);
}

export async function collect(
	parts: AsyncIterable<any> | Promise<AsyncIterable<any>>,
) {
	const collection = [];
	for await (const part of await parts) collection.push(part);
	return collection;
}

export function bodies(parts: any[]) {
	return parts.map(({ body, json }) => (json ? body : String(body)));
}
