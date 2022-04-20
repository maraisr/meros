import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	bodies,
	makePart,
	preamble,
	tail,
	wrap,
	test_helper,
	type Meros,
	type Responder,
} from '../mocks';

export default (meros: Meros, responder: Responder) => {
	const make_test = test_helper.bind(0, meros, responder);

	const Body = suite('body');

	Body('json', async () => {
		const collection = await make_test((push) => {
			push([preamble, wrap, makePart({ foo: 'bar' }), tail]);
		});

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
		const collection = await make_test((push) => {
			push([preamble, wrap, makePart('test'), tail]);
		});

		assert.equal(collection.length, 1);
		assert.equal(collection[0].json, false);
		assert.equal(collection[0].body.toString(), 'test');
	});

	Body('mixed', async () => {
		const collection = await make_test((push) => {
			push([
				preamble,
				wrap,
				makePart({ foo: 'bar' }),
				wrap,
				makePart('bar: baz'),
				tail,
			]);
		});

		assert.equal(collection.length, 2);

		assert.equal(collection[0].json, true);
		assert.equal(collection[0].body, { foo: 'bar' });
		assert.equal(collection[1].json, false);
		assert.equal(collection[1].body.toString(), 'bar: baz');
	});

	Body('unicode body', async () => {
		const collection = await make_test((push) => {
			push([preamble, wrap, makePart('🚀')]);

			push([wrap, makePart('😎'), tail]);
		});

		assert.equal(bodies(collection), ['🚀', '😎']);
	});

	Body('retain newlines', async () => {
		const collection = await make_test((push) => {
			push([
				preamble,
				wrap,
				makePart(`foo

bar

`),
			]);

			push([wrap, makePart('bar: baz\n'), tail]);
		});

		assert.equal(bodies(collection), [
			`foo

bar

`,
			`bar: baz
`,
		]);
	});

	// Doesnt mean --- can exist nakedly, multipart rules still apply.
	Body('boundary in payload*', async () => {
		const collection = await make_test((push) => {
			push([preamble, wrap, makePart({ test: '---' }), tail]);
		});

		assert.equal(bodies(collection), [{ test: '---' }]);
	});

	Body('boundary exist in multi payload*', async () => {
		const collection = await make_test((push) => {
			push([
				preamble,
				wrap,
				makePart({ one: '---' }),
				wrap,
				makePart({ two: '---' }),
				tail,
			]);
		});

		assert.equal(bodies(collection), [{ one: '---' }, { two: '---' }]);
	});

	Body('boundary exist in multi payloads*', async () => {
		const collection = await make_test((push) => {
			push([preamble, wrap, makePart({ one: '---' })]);

			push([wrap, makePart({ two: '---' }), tail]);
		});

		assert.equal(bodies(collection), [{ one: '---' }, { two: '---' }]);
	});

	Body.run();
};
