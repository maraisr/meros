import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	chunk,
	closingDelimiter,
	collect,
	delimiter,
	part,
	preamble,
	split,
	type TestContext,
} from '../utils';

export default ({ parse }: TestContext) => {
	const Headers = suite('headers');
	const fixture = part({ foo: 'bar' }, [
		'cache-control: public,max-age=30',
		'etag: test',
		'x-test: test:test',
		'x-test-2: test: test',
		'x-valid: _ :;.,/"\'?!(){}[]@<>=-+*#$&`|~^%',
	]);
	const expected = {
		'content-type': 'application/json; charset=utf-8',
		'cache-control': 'public,max-age=30',
		etag: 'test',
		'x-test': 'test:test',
		'x-test-2': 'test: test',
		'x-valid': '_ :;.,/"\'?!(){}[]@<>=-+*#$&`|~^%',
	};

	Headers('parses headers', async () => {
		const collection = await collect(
			parse([chunk(preamble, delimiter(), fixture, closingDelimiter())]),
		);

		assert.equal(
			collection.map(({ headers }) => headers),
			[expected],
		);
	});

	Headers('crossing chunks', async () => {
		const collection = await collect(
			parse([delimiter(), ...split(fixture, 11), closingDelimiter()]),
		);

		assert.equal(
			collection.map(({ headers }) => headers),
			[expected],
		);
	});

	Headers('no headers', async () => {
		const collection = await collect(
			parse([
				chunk(
					preamble,
					delimiter(),
					part('part', false),
					closingDelimiter(),
				),
			]),
		);

		assert.equal(
			collection.map(({ headers }) => headers),
			[{}],
		);
	});

	Headers.run();
};
