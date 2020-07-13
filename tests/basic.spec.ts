import './prelude';

import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import * as fmg from '../src';

import { makePart, mockFetch, mockJsonFetch } from './util';

const fetchMultipart = suite('fmg');

fetchMultipart('should work for perfect chunks', async () => {
	const payloads = [{ first: 'test' }, { second: 'test' }];

	const messages = await fmg.fetchMultipart<typeof payloads[number]>(
		mockFetch(payloads.map(makePart)),
	);

	const patches = [];
	for await (let value of messages) {
		patches.push(value);
	}

	assert.equal(patches, payloads);
});

fetchMultipart('should work for split chunks', async () => {
	const payloads = [{ first: 'test' }, { second: 'test' }];

	const [partA, partB] = payloads.map(makePart);

	const chunks = [
		partA.substr(0, 35),
		partA.substr(35, 80),
		partA.substr(35 + 80),
		partB.substr(0, 10),
		partB.substr(10, 11),
		partB.substr(11, 20),
		partB.substr(11 + 20),
	];

	const messages: any = await fmg.fetchMultipart(mockFetch(chunks));

	const patches: string[] = [];
	for await (let value of messages) {
		patches.push(value);
	}

	assert.equal(patches, payloads);
});

fetchMultipart('should work for 1 chunk multiple parts', async () => {
	const payloads = [{ first: 'test' }, { second: 'test' }];

	const chunks = payloads.map(makePart).join();

	const messages: any = await fmg.fetchMultipart(mockFetch([chunks]));

	const patches: string[] = [];
	for await (let value of messages) {
		patches.push(value);
	}

	assert.equal(patches, payloads);
});

fetchMultipart('should just return json when its not multipart', async () => {
	const payload = { first: 'test' };

	const messages = await fmg.fetchMultipart(mockJsonFetch(payload));

	const patches = [];
	for await (let value of messages) {
		patches.push(value);
	}

	assert.equal(patches, [payload]);
});

fetchMultipart.run();
