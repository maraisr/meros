import { randomBytes } from 'crypto';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	bodies,
	chunk,
	closingDelimiter,
	collect,
	delimiter,
	json,
	part,
	preamble,
	split,
	type Meros,
	type Responder,
} from '../utils';

export default function (meros: Meros, responder: Responder) {
	const Chunk = suite('chunking');

	Chunk('single part in one chunk', async () => {
		const collection = await collect(
			meros(
				responder([
					chunk(
						preamble,
						delimiter(),
						json({ foo: 'bar' }),
						closingDelimiter(),
					),
				]),
			),
		);

		assert.equal(bodies(collection), [{ foo: 'bar' }]);
	});

	Chunk('single part across chunks', async () => {
		const collection = await collect(
			meros(
				responder([
					chunk(preamble, delimiter()),
					chunk(part('one'), closingDelimiter()),
				]),
			),
		);

		assert.equal(bodies(collection), ['one']);
	});

	Chunk('multiple parts in one chunk', async () => {
		const collection = await collect(
			meros(
				responder([
					chunk(
						preamble,
						delimiter(),
						part('one'),
						delimiter(),
						part('two'),
						closingDelimiter(),
					),
				]),
			),
		);

		assert.equal(bodies(collection), ['one', 'two']);
	});

	Chunk('multiple parts across chunks', async () => {
		const collection = await collect(
			meros(
				responder([
					chunk(preamble, delimiter(), part('one')),
					chunk(delimiter(), part('two'), closingDelimiter()),
				]),
			),
		);

		assert.equal(bodies(collection), ['one', 'two']);
	});

	Chunk('utf-8 code points split across chunks', async () => {
		// a part is `\r\n` + body — 2 bytes, then the 4 byte emoji, so
		// subarray(4) splits mid way through its code point
		const bytes = Buffer.from(part('🤔'));

		const collection = await collect(
			meros(
				responder([
					delimiter(),
					bytes.subarray(0, 4),
					bytes.subarray(4),
					closingDelimiter(),
				]),
			),
		);

		assert.equal(bodies(collection), ['🤔']);
	});

	Chunk('handles heavily fragmented payloads', async () => {
		const result = [
			randomBytes(2000).toString('base64'),
			randomBytes(500).toString('utf8'),
			randomBytes(30).toString('hex'),
			randomBytes(3000).toString('ascii'),
		];
		const boundary = randomBytes(50).toString('hex');

		const chunks = [chunk(delimiter(boundary), part('one'))];

		for (const payload of result) {
			chunks.push(delimiter(boundary), ...split(part(payload), 12));
		}

		chunks.push(
			chunk(delimiter(boundary), part('two'), closingDelimiter(boundary)),
		);

		const collection = await collect(meros(responder(chunks, boundary)));

		assert.equal(bodies(collection), ['one', ...result, 'two']);
	});

	Chunk.run();

	const Multi = suite('chunking :: multi');

	Multi('groups parts by source chunk', async () => {
		const collection = await collect(
			meros(
				responder([
					chunk(
						preamble,
						delimiter(),
						json({ foo: 'bar' }),
						delimiter(),
					),
					chunk(
						json({ bar: 'baz' }),
						delimiter(),
						json({ foo: 'blitz' }),
						closingDelimiter(),
					),
				]),
				{ multiple: true },
			),
		);

		assert.equal(
			collection.map((parts) => bodies(parts)),
			[[{ foo: 'bar' }], [{ bar: 'baz' }, { foo: 'blitz' }]],
		);
	});

	Multi.run();
}
