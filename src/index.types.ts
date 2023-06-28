import { IncomingMessage } from 'http';
import type { Part } from 'meros';
import { meros } from 'meros';

declare function assert<T>(thing: T): void;

type Wrapped<T, B, F> = Promise<B | AsyncGenerator<Part<T, F>>>;

type Result = { name: string };

declare const responseNode: IncomingMessage;
assert<Wrapped<Result, IncomingMessage, Buffer>>(meros<Result>(responseNode));

{
	type P = Part<Result, Buffer>;
	const result = await meros<Result>(responseNode);
	if (!(result instanceof IncomingMessage)) {
		for await (let item of result) {
			assert<P>(item);

			if (item.json) assert<Result>(item.body);
			else assert<Buffer>(item.body);

			// @ts-expect-error
			assert<{ foo: string }>(item.body);

			assert<boolean>(item.json);
			assert<Record<string, string>>(item.headers);
		}
	}
}

declare const responseBrowser: Response;
assert<Wrapped<Result, Response, string>>(meros<Result>(responseBrowser));

{
	type P = Part<Result, string>;
	const result = await meros<Result>(responseBrowser);
	if (!(result instanceof Response)) {
		for await (let item of result) {
			assert<P>(item);

			if (item.json) assert<Result>(item.body);
			else assert<string>(item.body);

			// @ts-expect-error
			assert<{ foo: string }>(item.body);

			assert<boolean>(item.json);
			assert<Record<string, string>>(item.headers);
		}
	}
}
