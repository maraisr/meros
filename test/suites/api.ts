import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	chunk,
	delimiter,
	part,
	preamble,
	type Meros,
	type Responder,
} from '../utils';

export default function (meros: Meros, responder: Responder) {
	const API = suite('api');

	API('exports a function', () => {
		assert.type(meros, 'function');
	});

	API('returns an AsyncGenerator', async () => {
		const parts = await meros(responder([]));

		assert.type(parts[Symbol.asyncIterator], 'function');
	});

	API('finishes when the response stream closes', async () => {
		const parts = await meros(
			responder([
				chunk(preamble, delimiter(), part('test'), delimiter()),
			]),
		);

		let r = await parts.next();
		assert.equal(r.done, false);
		assert.equal(String(r.value.body), 'test');

		r = await parts.next();
		assert.equal(r.done, true);
		assert.equal(r.value, undefined);
	});

	API.run();
}
