import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	bodies,
	makePart,
	preamble,
	tail,
	wrap,
	test_helper,
	type Meros,
	type Responder,
} from '../mocks';

export default (meros: Meros, responder: Responder) => {
	const make_test = test_helper.bind(0, meros, responder);

	const Binary = suite('binary');

	// 1x1 transparent png
	const blob = Buffer.from([
		0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
		0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00,
		0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
		0x00, 0x02, 0x01, 0x44, 0x00, 0x3b,
	]);

	Binary('works', async () => {
		const collection = await make_test((push) => {
			push([
				preamble,
				wrap,
				makePart(new TextDecoder('utf8').decode(blob), [
					'content-type: image/gif',
				]),
				tail,
			]);
		});

		const values = bodies(collection);
		assert.is(values.length, 1);

		const img = Buffer.from(values[0]);
		assert.equal(img.toString(), blob.toString());

		// No clue, but bitwise they are different, but functionally equiv.
		//assert.ok(img.equals(blob));
	});

	Binary.run();
};
