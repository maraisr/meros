export async function* generate<T>(
	stream: ReadableStream<Uint8Array>,
	boundary: string,
): AsyncGenerator<T> {
	const isPreamble = true;

	let buffer: Uint8Array;
	const reader = stream.getReader();

	try {
		let done;

		do {
			const result = await reader.read();
			done = result.done;

			if (!buffer) {
				buffer = result.value;
			}

			debugger;
		} while (!done);
	} finally {
		reader.releaseLock();
	}
}
