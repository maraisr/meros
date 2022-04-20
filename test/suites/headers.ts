import { makePushPullAsyncIterableIterator } from '@n1ru4l/push-pull-async-iterable-iterator';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { makePart, type Meros, preamble, type Responder, splitString, tail, wrap } from '../mocks';

export default (meros: Meros, responder: Responder) => {
	const Headers = suite('headers');

	Headers('smoke', async () => {
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
			}, [
				'cache-control: public,max-age=30',
				'etag: test',
				'x-test: test:test', // tests the colon
				'x-test-2: test: test', // tests the colon
				'x-valid: _ :;.,\/"\'?!(){}[]@<>=-+*#$&`|~^%',
			]),
			tail,
		]);

		for await (let { headers } of parts) {
			collection.push(headers);
		}

		assert.equal(collection, [
			{
				'content-type': 'application/json; charset=utf-8',
				'cache-control': 'public,max-age=30',
				'etag': 'test',
				'x-test': 'test:test',
				'x-test-2': 'test: test',
				'x-valid': '_ :;.,\/"\'?!(){}[]@<>=-+*#$&`|~^%',
			},
		]);
	});

	Headers('crossing chunks', async () => {
		const {
			asyncIterableIterator,
			pushValue,
		} = makePushPullAsyncIterableIterator();
		const response = await responder(asyncIterableIterator, '-');
		const parts = await meros(response);

		const collection = [];

		pushValue([
			wrap,
			...splitString(makePart({
				foo: 'bar',
			}, [
				'cache-control: public,max-age=30',
				'etag: test',
				'x-test: test:test', // tests the colon
				'x-test-2: test: test', // tests the colon
				'x-valid: _ :;.,\/"\'?!(){}[]@<>=-+*#$&`|~^%',
			]), 11),
			tail,
		]);

		for await (let { headers } of parts) {
			collection.push(headers);
		}

		assert.equal(collection, [
			{
				'content-type': 'application/json; charset=utf-8',
				'cache-control': 'public,max-age=30',
				'etag': 'test',
				'x-test': 'test:test',
				'x-test-2': 'test: test',
				'x-valid': '_ :;.,\/"\'?!(){}[]@<>=-+*#$&`|~^%',
			},
		]);
	});

	Headers('no headers', async () => {
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
			makePart('part', false),
			tail,
		]);

		for await (let { headers } of parts) {
			collection.push(headers);
		}

		assert.equal(collection, [{}]);
	});

	Headers.run();
}
