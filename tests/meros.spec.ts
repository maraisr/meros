import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { mockResponseBrowser, mockResponseNode } from '../lib/mocks';
import { meros as merosBrowser } from '../src/browser';
import { meros as merosNode } from '../src/node';

function test(name, mod, responser) {
	const tester = suite(name);

	tester('exports', () => {
		assert.type(mod, 'function');
	});

	tester('should yield single chunk', async () => {
		const response = await responser([{ foo: 'bar' }], 'abc123');

		const parts = await mod(response);
		const collection = [];

		for await (let part of parts) {
			collection.push(part);
		}

		assert.is(collection.length, 1);
		assert.equal(collection, [{ foo: 'bar' }]);
	});

	tester('should yield cross chunk', async () => {
		const response = await responser(
			[[{ foo: 'bar' }, { bar: 'baz' }]],
			'abc123',
		);

		const parts = await mod(response);
		const collection = [];

		for await (let part of parts) {
			collection.push(part);
		}

		assert.is(collection.length, 2);
		assert.equal(collection, [{ foo: 'bar' }, { bar: 'baz' }]);
	});

	tester('should see plain text and json separately', async () => {
		const response = await responser(
			[{ foo: 'bar' }, 'baz', { baz: 'foo' }],
			'abc123',
		);

		const parts = await mod(response);
		const collection = [];

		for await (let part of parts) {
			collection.push(part);
		}

		assert.is(collection.length, 3);
		assert.equal(collection, [{ foo: 'bar' }, 'baz', { baz: 'foo' }]);
	});

	tester.run();

	return tester;
}

test('node', merosNode, mockResponseNode);
test('browser', merosBrowser, mockResponseBrowser);
