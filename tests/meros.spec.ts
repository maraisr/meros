// @ts-nocheck

import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { mockResponseBrowser, mockResponseNode } from '../lib/mocks';
import { meros as merosBrowser } from '../src/browser';
import { meros as merosNode } from '../src/node';

function test(
	name: string,
	mod: typeof merosNode | typeof merosBrowser,
	responder: typeof mockResponseNode | typeof mockResponseNode,
) {
	const tester = suite(name);

	tester('exports', () => {
		assert.type(mod, 'function');
	});

	tester('should yield single chunk', async () => {
		const response = await responder([{ foo: 'bar' }], 'abc123');

		const parts = await mod(response);
		const collection = [];

		for await (let part of parts) {
			collection.push(part);
		}

		assert.is(collection.length, 1, "it should have yield'd once");
		assert.equal(collection, [{ foo: 'bar' }]);
	});

	tester('should yield cross chunk', async () => {
		const response = await responder(
			[[{ foo: 'bar' }, { bar: 'baz' }]],
			'abc123',
		);

		const parts = await mod(response);
		const collection = [];

		for await (let part of parts) {
			collection.push(part);
		}

		assert.is(collection.length, 2, "it should have yield'd twice");
		assert.equal(collection, [{ foo: 'bar' }, { bar: 'baz' }]);
	});

	tester('should yield for single chunk', async () => {
		const response = await responder(
			[[{ foo: 'bar' }, { bar: 'baz' }]],
			'abc123',
			false,
		);

		const parts = await mod(response);
		const collection = [];

		for await (let part of parts) {
			collection.push(part);
		}

		assert.is(collection.length, 2, "it should have yield'd twice");
		assert.equal(collection, [{ foo: 'bar' }, { bar: 'baz' }]);
	});

	tester('should see plain text and json separately', async () => {
		const response = await responder(
			[{ foo: 'bar' }, 'baz', { baz: 'foo' }],
			'-',
		);

		const parts = await mod(response);
		const collection = [];

		for await (let part of parts) {
			collection.push(part);
		}

		assert.is(collection.length, 3, "it should have yield'd three times");
		assert.equal(collection, [{ foo: 'bar' }, 'baz', { baz: 'foo' }]);
	});

	tester('should allow unicode body', async () => {
		const response = await responder(['👀'], 'abc123');

		const parts = await mod(response);
		const collection = [];

		for await (let part of parts) {
			collection.push(part);
		}

		assert.is(collection.length, 1, "it should have yield'd once");
		assert.equal(collection[0], '👀');
	});

	/*
	Because of:
	The boundary parameter, which consists of 1 to 70 characters from a set of characters known to be very robust through mail gateways, and NOT ending with white space.

	That would make unicode like emoji... fairly robust?
	 */
	tester('should allow unicode boundary', async () => {
		const response = await responder(
			['howdy', 'teddy bear'],
			'😘'
		);

		const parts = await mod(response);
		const collection = [];

		for await (let part of parts) {
			collection.push(part);
		}

		assert.is(collection.length, 2, "it should have yield'd twice");
		assert.equal(collection, ['howdy', 'teddy bear']);
	});

	tester('should handle quoted boundaries', async () => {
		const response = await responder(
			['howdy', 'teddy bear'],
			'"test-boundary"',
		);

		const parts = await mod(response);
		const collection = [];

		for await (let part of parts) {
			collection.push(part);
		}

		assert.is(collection.length, 2, "it should have yield'd twice");
		assert.equal(collection, ['howdy', 'teddy bear']);
	});

	return tester;
}

test('node', merosNode, mockResponseNode).run();
test('browser', merosBrowser, mockResponseBrowser).run();
