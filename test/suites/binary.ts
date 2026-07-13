import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	bodies,
	chunk,
	closingDelimiter,
	collect,
	delimiter,
	part,
	preamble,
	type TestContext,
} from '../utils';

export default ({ parse }: TestContext) => {
	const Binary = suite('binary');

	// 1x1 transparent GIF
	const blob = Buffer.from([
		0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
		0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00,
		0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
		0x00, 0x02, 0x01, 0x44, 0x00, 0x3b,
	]);

	Binary('preserves a non-JSON body', async () => {
		const image = new TextDecoder('utf8').decode(blob);
		const collection = await collect(
			parse([
				chunk(
					preamble,
					delimiter(),
					part(image, ['content-type: image/gif']),
					closingDelimiter(),
				),
			]),
		);

		assert.equal(bodies(collection), [image]);
	});

	Binary.run();
};
