import { makePushPullAsyncIterableIterator } from '@n1ru4l/push-pull-async-iterable-iterator';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { makePart, type Meros, preamble, type Responder, splitString, tail, wrap } from '../mocks';

export default (meros: Meros, responder: Responder) => {
	const Boundary = suite('boundary');

	const make_test = async (boundary: string) => {
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
	};

	for (let boundary of [
		'-',
		'abc123',
		'abcdefghijklmnopqrstuvwxyz_abcdefghijklmnopqrstuvwxyz',
		'✨',
		// '✨🤔', // TODO: This should work 🤪
		'"boundary"',
		':::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::',
		'----------------------------------------------------------',
		'---',
		'===',
	]) {
		Boundary(boundary, make_test.bind(0, boundary));
	}

	Boundary.run();
}
