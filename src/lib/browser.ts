export async function* generate<T>(
	stream: ReadableStream<Uint8Array>,
	boundary: string,
): AsyncGenerator<T> {
	debugger;
	const reader = stream.getReader();
}
