import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import * as fmg from '../src';

const fetchMultipart = suite('fmg');

fetchMultipart.before(() => {
	// @ts-ignore
	global.fetch = () => {
		return new Promise((resolve) =>
			setTimeout(() => void resolve('test'), 1e2),
		);
	};
});

fetchMultipart('should work', async () => {
	const messages = await fmg.fetchMultipart();

	for await (let value of messages) {
		debugger;
	}
	assert.equal(['test'], ['test']);
});

fetchMultipart.run();
