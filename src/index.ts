export async function* fetchMultipart(input?: Request): AsyncGenerator {
	const req = await fetch(input);

	yield req;
}
