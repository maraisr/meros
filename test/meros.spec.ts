// @ts-nocheck

import { makePushPullAsyncIterableIterator } from '@n1ru4l/push-pull-async-iterable-iterator';
import { suite, Test } from 'uvu';
import * as assert from 'uvu/assert';
import { meros as merosBrowser } from '../src/browser';
import { meros as merosNode } from '../src/node';
import {
	makePart,
	mockResponseBrowser,
	mockResponseNode,
	preamble,
	splitString,
	tail,
	wrap,
} from './mocks';

function testFor(
	name: string,
	meros: typeof merosNode | typeof merosBrowser,
	responder: typeof mockResponseNode | typeof mockResponseBrowser,
) {
	const describe = (ns: string, cb: (t: Test) => void) => {
		const t = suite(`${name}~${ns}`);
		cb(t);
		t.run();
	};

	// ---

	const multiPayloadMultiChunk = async (boundary) => {
		try {
			const {
				asyncIterableIterator,
				pushValue,
			} = makePushPullAsyncIterableIterator();
			const response = await responder(asyncIterableIterator, boundary);

			const part = [
				preamble(),
				wrap(boundary),
				makePart({
					foo: 'bar',
				}),
				wrap(boundary),
				makePart({
					bar: 'baz',
				}),
				tail(boundary),
			];

			const split_parts = splitString(part.join(''), 11);

			const parts = await meros(response);
			const collection = [];

			for (const chunk of split_parts) {
				pushValue([chunk]);
			}

			for await (let { body: part } of parts) {
				collection.push(part);
			}

			assert.equal(collection, [{ foo: 'bar' }, { bar: 'baz' }]);
		} catch (e) {
			console.log(e);
		}
	};

	describe('api', (t) => {
		t('should export a function', () => {
			assert.type(meros, 'function');
		});

		t('should resolve to an AsyncGenerator', async () => {
			const {
				asyncIterableIterator,
				pushValue,
			} = makePushPullAsyncIterableIterator();
			const response = await responder(asyncIterableIterator, '-');
			const parts = await meros(response);

			assert.type(parts[Symbol.asyncIterator], 'function');
		});

		t('should cleanup when `?.returns` fires', async () => {
			const {
				asyncIterableIterator,
				pushValue,
			} = makePushPullAsyncIterableIterator();
			const response = await responder(asyncIterableIterator, '-');
			const parts = await meros(response);

			pushValue([
				preamble,
				wrap,
				makePart({
					foo: 'bar',
				}),
				wrap,
			]);

			let r = await parts.next();
			assert.equal(r.done, false);
			assert.equal(r.value.body, { foo: 'bar' });

			await asyncIterableIterator.return();

			pushValue([
				makePart({
					foo: 'bar',
				}),
				tail,
			]);

			r = await parts.next();
			assert.equal(r.done, true);
			assert.equal(r.value, undefined);
		});
	});

	describe('processing', (t) => {
		t('should yield single payload single chunk', async () => {
			const {
				asyncIterableIterator,
				pushValue,
			} = makePushPullAsyncIterableIterator();
			const response = await responder(asyncIterableIterator, '-');

			const parts = await meros(response);
			const collection = [];

			pushValue([
				preamble,
				wrap,
				makePart({
					foo: 'bar',
				}),
				tail,
			]);

			for await (let { body: part } of parts) {
				collection.push(part);
			}

			assert.equal(collection, [{ foo: 'bar' }]);
		});

		t('should yield single payload cross chunk', async () => {
			const {
				asyncIterableIterator,
				pushValue,
			} = makePushPullAsyncIterableIterator();
			const response = await responder(asyncIterableIterator, '-');

			const part = makePart({
				foo: 'bar',
			});
			const split_parts = splitString(part, 2);

			const parts = await meros(response);
			const collection = [];

			pushValue([preamble, wrap, split_parts[0]]);

			pushValue([split_parts[1], tail]);

			for await (let { body: part } of parts) {
				collection.push(part);
			}

			assert.equal(collection, [{ foo: 'bar' }]);
		});

		t('should yield multiple payload single chunk', async () => {
			const {
				asyncIterableIterator,
				pushValue,
			} = makePushPullAsyncIterableIterator();
			const response = await responder(asyncIterableIterator, '-');

			const parts = await meros(response);
			const collection = [];

			pushValue([
				preamble,
				wrap,
				makePart({
					foo: 'bar',
				}),
				wrap,
				makePart({
					bar: 'baz',
				}),
				tail,
			]);

			for await (let { body: part } of parts) {
				collection.push(part);
			}

			assert.equal(collection, [{ foo: 'bar' }, { bar: 'baz' }]);
		});

		t('should yield multiple payload cross chunk', async () => {
			await multiPayloadMultiChunk('-');
		});

		t('should return array when multi true', async () => {
			const {
				asyncIterableIterator,
				pushValue,
			} = makePushPullAsyncIterableIterator();
			const response = await responder(asyncIterableIterator, '-');
			const parts = await meros(response, { multiple: true });

			pushValue([preamble, wrap, makePart({ foo: 'bar' }), wrap]);

			let { value } = await parts.next();
			assert.is(Array.isArray(value), true);
			assert.equal(value, [
				{
					headers: {
						'content-type': 'application/json',
					},
					body: { foo: 'bar' },
					json: true,
				},
			]);

			pushValue([
				makePart({ bar: 'baz' }),
				wrap,
				makePart({ foo: 'bliz' }),
				tail,
			]);

			value = (await parts.next()).value;
			assert.is(Array.isArray(value), true);
			assert.equal(
				value.map((i) => i.body),
				[{ bar: 'baz' }, { foo: 'bliz' }],
			);
		});
	});

	describe('body', (t) => {
		t('should yield json and plaintext', async () => {
			const {
				asyncIterableIterator,
				pushValue,
			} = makePushPullAsyncIterableIterator();
			const response = await responder(asyncIterableIterator, '-');

			const parts = await meros(response);
			const collection = [];

			pushValue([
				preamble,
				wrap,
				makePart({
					foo: 'bar',
				}),
				wrap,
				makePart('bar: baz'),
				tail,
			]);

			for await (let { body: part } of parts) {
				collection.push(Buffer.isBuffer(part) ? part.toString() : part);
			}

			assert.equal(collection, [{ foo: 'bar' }, 'bar: baz']);
		});

		t('should allow unicode body', async () => {
			const {
				asyncIterableIterator,
				pushValue,
			} = makePushPullAsyncIterableIterator();
			const response = await responder(asyncIterableIterator, '-');

			const parts = await meros(response);
			const collection = [];

			pushValue([preamble, wrap, makePart('🚀'), wrap]);

			pushValue([makePart('😎'), tail]);

			for await (let { body: part } of parts) {
				collection.push(Buffer.isBuffer(part) ? part.toString() : part);
			}

			assert.equal(collection, ['🚀', '😎']);
		});

		t('should retain newlines', async () => {
			const {
				asyncIterableIterator,
				pushValue,
			} = makePushPullAsyncIterableIterator();
			const response = await responder(asyncIterableIterator, '-');

			const parts = await meros(response);
			const collection = [];

			pushValue([
				preamble,
				wrap,
				makePart(`foo

bar

`),
				wrap,
				makePart('bar: baz\n'),
				tail,
			]);

			for await (let { body: part } of parts) {
				collection.push(Buffer.isBuffer(part) ? part.toString() : part);
			}

			assert.equal(collection, [
				`foo

bar

`,
				`bar: baz
`,
			]);
		});
	});

	describe('boundary', (t) => {
		t('should allow complex', async () => {
			await multiPayloadMultiChunk('abc123');
		});

		t('should allow really long boundary', async () => {
			await multiPayloadMultiChunk(
				'abcdefghijklmnopqrstuvwxyz_abcdefghijklmnopqrstuvwxyz',
			);
		});

		/*
		Because of:
		The boundary parameter, which consists of 1 to 70 characters from a set of characters known to be very robust through mail gateways, and NOT ending with white space.

		That would make unicode like emoji... fairly robust?
		*/
		t('should allow unicode', async () => {
			await multiPayloadMultiChunk('✨');
		});

		t('should allow quoted', async () => {
			await multiPayloadMultiChunk('"boundary"');
		});
	});
}

testFor('node', merosNode, mockResponseNode);
testFor('browser', merosBrowser, mockResponseBrowser);
