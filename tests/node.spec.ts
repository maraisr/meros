import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { mockResponseNode } from '../lib/mocks';

import * as meros from '../src/node';

test('exports', () => {
	assert.type(meros.meros, 'function');
});

test('can make a call', async () => {
	const response = await mockResponseNode(
		[
			{ hello: 'world' },
			[{ other: 'world' }, { another: 'world' }],
			{
				massive: {
					nested: {
						world: 'okay',
					},
				},
			},
			'should be plain text',
		],
		'abc123',
	);
	const parts = await meros.meros<object>(response);

	const collection: Array<object> = [];

	for await (let part of parts) {
		collection.push(part);
	}

	assert.is(collection.length, 5);

	assert.equal(collection, [
		{ hello: 'world' },
		{ other: 'world' },
		{ another: 'world' },
		{ massive: { nested: { world: 'okay' } } },
		'should be plain text',
	]);
});

test.run();
