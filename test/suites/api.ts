import { makePushPullAsyncIterableIterator } from '@n1ru4l/push-pull-async-iterable-iterator';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import type { Meros, Responder } from '../mocks';
import { makePart, preamble, tail, wrap } from '../mocks';

export default (meros: Meros, responder: Responder) => {
	const API = suite('api');

	API('should export a function', () => {
		assert.type(meros, 'function');
	});

	API('should resolve to an AsyncGenerator', async () => {
		const { asyncIterableIterator } = makePushPullAsyncIterableIterator();
		const response = await responder(asyncIterableIterator, '-');
		const parts = await meros(response);

		assert.type(parts[Symbol.asyncIterator], 'function');
	});

	API('should cleanup when `returns` fires', async () => {
		const {
			asyncIterableIterator,
			pushValue,
		} = makePushPullAsyncIterableIterator();
		const response = await responder(asyncIterableIterator, '-');
		const parts = await meros(response);

		pushValue([
			preamble,
			wrap,
			makePart('test'),
			wrap,
		]);

		let r = await parts.next();
		assert.equal(r.done, false);
		assert.equal(r.value.body.toString(), 'test');

		await asyncIterableIterator.return();

		pushValue([
			makePart('test'),
			tail,
		]);

		r = await parts.next();
		assert.equal(r.done, true);
		assert.equal(r.value, undefined);
	});

	API.run();
}
