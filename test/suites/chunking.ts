import { makePushPullAsyncIterableIterator } from '@n1ru4l/push-pull-async-iterable-iterator';

import { randomBytes } from 'crypto';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	bodies,
	makePart,
	preamble,
	splitString,
	tail,
	wrap,
	test_helper,
	type Meros,
	type Responder,
} from '../mocks';

export default (meros: Meros, responder: Responder) => {
	const make_test = test_helper.bind(0, meros, responder);

	const Chunk = suite('chunking');

	Chunk('single yield single chunk', async () => {
		const collection = await make_test((push) => {
			push([preamble, wrap, makePart({ foo: 'bar' }), tail]);
		});

		assert.equal(bodies(collection), [{ foo: 'bar' }]);
	});

	Chunk('single yield multi chunk', async () => {
		const collection = await make_test((push) => {
			push([preamble, wrap]);

			push([makePart('one'), tail]);
		});

		assert.equal(bodies(collection), ['one']);
	});

	Chunk('multiple yields single chunk', async () => {
		const collection = await make_test((push) => {
			push([
				preamble,
				wrap,
				makePart('one'),
				wrap,
				makePart('two'),
				tail,
			]);
		});

		assert.equal(bodies(collection), ['one', 'two']);
	});

	Chunk('multiple yields multi chunk', async () => {
		const collection = await make_test((push) => {
			push([preamble, wrap, makePart('one')]);

			push([wrap, makePart('two'), tail]);
		});

		assert.equal(bodies(collection), ['one', 'two']);
	});

	Chunk('goes rambo', async () => {
		const result = [
			randomBytes(2000).toString('base64'),
			randomBytes(500).toString('utf8'),
			randomBytes(30).toString('hex'),
			randomBytes(3000).toString('ascii'),
		];
		const boundary = randomBytes(50).toString('hex');

		const collection = await make_test((push) => {
			push([wrap(boundary), makePart('one')]);

			for (let payload of result) {
				push([wrap(boundary)]);
				for (let chunk of splitString(makePart(payload), 12)) {
					push([chunk]);
				}
			}

			push([wrap(boundary), makePart('two'), tail(boundary)]);
		}, boundary);

		assert.equal(bodies(collection), ['one', ...result, 'two']);
	});

	Chunk.run();

	const Multi = suite('chunking :: multi');

	Multi('when true :: basic', async () => {
		const { asyncIterableIterator, pushValue } =
			makePushPullAsyncIterableIterator();
		const response = await responder(asyncIterableIterator, '-');
		const parts = await meros(response, { multiple: true });

		pushValue([preamble, wrap, makePart({ foo: 'bar' }), wrap]);

		let { value } = await parts.next();
		assert.is(Array.isArray(value), true);
		assert.equal(value, [
			{
				headers: {
					'content-type': 'application/json; charset=utf-8',
				},
				body: { foo: 'bar' },
				json: true,
			},
		]);

		pushValue([
			makePart({ bar: 'baz' }),
			wrap,
			makePart({ foo: 'blitz' }),
			tail,
		]);

		value = (await parts.next()).value;
		assert.is(Array.isArray(value), true);
		assert.equal(
			value.map((i: any) => i.body),
			[{ bar: 'baz' }, { foo: 'blitz' }],
		);
	});

	Multi.run();
};
