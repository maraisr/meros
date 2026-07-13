import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { chunk, delimiter, part, preamble, type TestContext } from '../utils';

export default ({ implementation, parse }: TestContext) => {
	const API = suite('api');

	API('exports a function', () => {
		assert.type(implementation, 'function');
	});

	API('returns an AsyncGenerator', async () => {
		const parts = await parse([]);

		assert.type(parts[Symbol.asyncIterator], 'function');
	});

	API('finishes when the response stream closes', async () => {
		const parts = await parse([
			chunk(preamble, delimiter(), part('test'), delimiter()),
		]);

		let r = await parts.next();
		assert.equal(r.done, false);
		if (r.done) throw new Error('Expected a parsed part');
		assert.equal(String(r.value.body), 'test');

		r = await parts.next();
		assert.equal(r.done, true);
		assert.equal(r.value, undefined);
	});

	API.run();
};
