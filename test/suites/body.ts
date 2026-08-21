import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	bodies,
	chunk,
	closingDelimiter,
	collect,
	delimiter,
	part,
	preamble,
	type Meros,
	type Responder,
} from '../utils';

export default function (meros: Meros, responder: Responder) {
	const Body = suite('body');

	Body('json', async () => {
		const collection = await collect(
			meros(
				responder([
					chunk(
						preamble,
						delimiter(),
						part({ foo: 'bar' }),
						closingDelimiter(),
					),
				]),
			),
		);

		assert.equal(collection, [
			{
				body: { foo: 'bar' },
				json: true,
				headers: {
					'content-type': 'application/json; charset=utf-8',
				},
			},
		]);
	});

	Body('plain-text', async () => {
		const collection = await collect(
			meros(
				responder([
					chunk(
						preamble,
						delimiter(),
						part('test'),
						closingDelimiter(),
					),
				]),
			),
		);

		assert.equal(collection.length, 1);
		assert.equal(collection[0].json, false);
		assert.equal(String(collection[0].body), 'test');
	});

	Body('mixed', async () => {
		const collection = await collect(
			meros(
				responder([
					chunk(
						preamble,
						delimiter(),
						part({ foo: 'bar' }),
						delimiter(),
						part('bar: baz'),
						closingDelimiter(),
					),
				]),
			),
		);

		assert.equal(collection.length, 2);

		assert.equal(collection[0].json, true);
		assert.equal(collection[0].body, { foo: 'bar' });
		assert.equal(collection[1].json, false);
		assert.equal(String(collection[1].body), 'bar: baz');
	});

	Body('unicode body', async () => {
		const collection = await collect(
			meros(
				responder([
					chunk(preamble, delimiter(), part('🚀')),
					chunk(delimiter(), part('😎'), closingDelimiter()),
				]),
			),
		);

		assert.equal(bodies(collection), ['🚀', '😎']);
	});

	Body('retain newlines', async () => {
		const collection = await collect(
			meros(
				responder([
					chunk(
						preamble,
						delimiter(),
						part(`foo

bar

`),
					),
					chunk(delimiter(), part('bar: baz\n'), closingDelimiter()),
				]),
			),
		);

		assert.equal(bodies(collection), [
			`foo

bar

`,
			`bar: baz
`,
		]);
	});

	// Boundary-like text is valid when it is not on a delimiter line.
	Body('boundary-like text in a payload', async () => {
		const collection = await collect(
			meros(
				responder([
					chunk(
						preamble,
						delimiter(),
						part({ test: '---' }),
						closingDelimiter(),
					),
				]),
			),
		);

		assert.equal(bodies(collection), [{ test: '---' }]);
	});

	Body('boundary-like text in multiple parts in one chunk', async () => {
		const collection = await collect(
			meros(
				responder([
					chunk(
						preamble,
						delimiter(),
						part({ one: '---' }),
						delimiter(),
						part({ two: '---' }),
						closingDelimiter(),
					),
				]),
			),
		);

		assert.equal(bodies(collection), [{ one: '---' }, { two: '---' }]);
	});

	Body('boundary-like text in multiple parts across chunks', async () => {
		const collection = await collect(
			meros(
				responder([
					chunk(preamble, delimiter(), part({ one: '---' })),
					chunk(
						delimiter(),
						part({ two: '---' }),
						closingDelimiter(),
					),
				]),
			),
		);

		assert.equal(bodies(collection), [{ one: '---' }, { two: '---' }]);
	});

	Body.run();
}
