import { type Part } from 'meros';
import { meros } from 'meros/browser';

declare function assert<T>(thing: T): void;

declare const response: Response;

type Result = { name: string };
type ThePart<T> = Part<T, string>;
type Unwrapped<T> = Promise<Response | AsyncGenerator<ThePart<T>>>;

assert<Unwrapped<Result>>(meros<Result>(response));

{
	const result = await meros<Result>(response);
	if (!(result instanceof Response)) {
		for await (let item of result) {
			assert<ThePart<Result>>(item);

			if (item.json) assert<Result>(item.body);
			else assert<string>(item.body);

			// @ts-expect-error
			assert<{ foo: string }>(item.body);

			assert<boolean>(item.json);
			assert<Record<string, string>>(item.headers);
		}
	}
}

{
	const result = await meros<Result>(response, { multiple: true });
	if (!(result instanceof Response)) {
		for await (let parts of result) {
			assert<readonly ThePart<Result>[]>(parts);

			for (let item of parts) {
				assert<ThePart<Result>>(item);

				if (item.json) assert<Result>(item.body);
				else assert<string>(item.body);

				// @ts-expect-error
				assert<{ foo: string }>(item.body);

				assert<boolean>(item.json);
				assert<Record<string, string>>(item.headers);
			}
		}
	}
}
