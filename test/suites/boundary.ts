import { makePushPullAsyncIterableIterator } from '@n1ru4l/push-pull-async-iterable-iterator';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { type Meros, type Responder, splitString } from '../mocks';

export default (meros: Meros, responder: Responder) => {
	const Boundary = suite('boundary');

	const make_test = async (
		boundary: string,
		with_preamble_boundary = true,
	) => {
		const { asyncIterableIterator, pushValue } =
			makePushPullAsyncIterableIterator();
		const response = await responder(asyncIterableIterator, boundary);

		const part = [
			`${with_preamble_boundary ? '\r\n' : ''}--${boundary}\r\n`,
			'\n',
			'one',
			`\r\n--${boundary}\r\n`,
			'\n',
			'two',
			`\r\n--${boundary}\r\n`,
			'content-type: application/json\r\n',
			'\r\n',
			'"three"',
			`\r\n--${boundary}--`,
		];

		const split_parts = splitString(part.join(''), 11);

		const parts = await meros(response);
		const collection = [];

		for (const chunk of split_parts) {
			pushValue([chunk]);
		}

		for await (let { body: part } of parts) {
			collection.push(String(part));
		}

		assert.equal(collection, ['one', 'two', 'three']);
	};

	for (let boundary of [
		'-',
		'abc123',
		'abcdefghijklmnopqrstuvwxyz_abcdefghijklmnopqrstuvwxyz',
		'✨',
		// '✨🤔', // TODO: This should work 🤪
		':::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::',
		'----------------------------------------------------------',
		'---',
		'===',
	]) {
		Boundary(boundary, make_test.bind(0, boundary, true));
		Boundary(boundary, make_test.bind(0, boundary, false));
	}

	Boundary.run();
};
