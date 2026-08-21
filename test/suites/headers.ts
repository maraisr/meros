import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	chunk,
	closingDelimiter,
	collect,
	delimiter,
	json,
	part,
	preamble,
	split,
	type Meros,
	type Responder,
} from '../utils';

export default function (meros: Meros, responder: Responder) {
	const Headers = suite('headers');
	const fixture = chunk(
		'cache-control: public,max-age=30\r\n',
		'etag: test\r\n',
		'x-test: test:test\r\n',
		'x-test-2: test: test\r\n',
		'x-valid: _ :;.,/"\'?!(){}[]@<>=-+*#$&`|~^%\r\n',
		json({ foo: 'bar' }),
	);
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
			meros(
				responder([
					chunk(preamble, delimiter(), fixture, closingDelimiter()),
				]),
			),
		);

		assert.equal(
			collection.map(({ headers }) => headers),
			[expected],
		);
	});

	Headers('crossing chunks', async () => {
		const collection = await collect(
			meros(
				responder([
					delimiter(),
					...split(fixture, 11),
					closingDelimiter(),
				]),
			),
		);

		assert.equal(
			collection.map(({ headers }) => headers),
			[expected],
		);
	});

	Headers('no headers', async () => {
		const collection = await collect(
			meros(
				responder([
					chunk(
						preamble,
						delimiter(),
						part('part'),
						closingDelimiter(),
					),
				]),
			),
		);

		assert.equal(
			collection.map(({ headers }) => headers),
			[{}],
		);
	});

	Headers.run();
}
