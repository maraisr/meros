import * as http from 'http';
import type { IncomingMessage } from 'http';

import { test } from 'uvu';
import * as assert from 'uvu/assert';

import * as meros from '../src/node';
import { configureServer } from './server';

configureServer(test);

const makeCall = (port: number) =>
	new Promise<IncomingMessage>((resolve) => {
		const request = http.get(
			`http://localhost:${port}/mock-ep`,
			(response) => {
				resolve(response);
			},
		);
		request.end();
	});

test('exports', () => {
	assert.type(meros.meros, 'function');
});

test('can make a call', async (context) => {
	const response = await makeCall(context.port);
	const parts = await meros.meros<object>(response);

	let collection: Array<object> = [],
		itt = 0;

	for await (let part of parts) {
		++itt;
		collection.push(part);
	}

	assert.equal(collection, [
		{ hello: 'world' },
		{ other: 'world' },
		{ another: 'world' },
		{ massive: { nested: { world: 'okay' } } },
		'should be plain text',
	]);
	assert.equal(itt, 5);
});

test.run();
