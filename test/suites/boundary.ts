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
	split,
	type TestContext,
} from '../utils';

export default ({ parse }: TestContext) => {
	const Boundary = suite('boundary');

	const testBoundary = async (boundary: string, withLeadingCrLf = true) => {
		const multipart = [
			`${withLeadingCrLf ? '\r\n' : ''}--${boundary}\r\n`,
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

		const collection = await collect(
			parse(split(multipart.join(''), 11), { boundary }),
		);

		assert.equal(bodies(collection), ['one', 'two', 'three']);
	};

	for (const boundary of [
		'abc123',
		'abcdefghijklmnopqrstuvwxyz_abcdefghijklmnopqrstuvwxyz',
		'✨',
		// '✨🤔', // TODO: This should work 🤪
		':::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::',
		'----------------------------------------------------------',
		'---',
		'===',
		"'",
		'(',
		')',
		'+',
		'_',
		',',
		'-',
		'.',
		'/',
		':',
		'=',
		'?',
	]) {
		Boundary(`${boundary} with leading CRLF`, () =>
			testBoundary(boundary, true),
		);
		Boundary(`${boundary} without leading CRLF`, () =>
			testBoundary(boundary, false),
		);
	}

	Boundary('RFC 1521 page 69', async () => {
		const collection = await collect(
			parse(
				[
					chunk(
						preamble,
						delimiter(),
						part({ foo: 'bar' }),
						delimiter(),
						part({ bar: 'baz' }),
						closingDelimiter(),
					),
				],
				{
					headers: {
						'content-type':
							'multipart/mixed;boundary="-";charset=utf-8',
					},
				},
			),
		);

		assert.equal(bodies(collection), [{ foo: 'bar' }, { bar: 'baz' }]);
	});

	for (const type of [
		'multipart/mixed',
		'multipart/x-mixed-replace',
		'multipart/alternative',
		'multipart/digest',
		'multipart/parallel',
		'multipart/form-data',
		'multipart/encrypted',
		'multipart/signed',
		'multipart/related',
		'multipart/report',
	]) {
		Boundary(`using ${type}`, async () => {
			const collection = await collect(
				parse(
					[
						chunk(
							preamble,
							delimiter(),
							part({ foo: 'bar' }),
							delimiter(),
							part({ bar: 'baz' }),
							closingDelimiter(),
						),
					],
					{
						headers: {
							'content-type': `${type};boundary="-";charset=utf-8`,
						},
					},
				),
			);

			assert.equal(bodies(collection), [{ foo: 'bar' }, { bar: 'baz' }]);
		});
	}

	Boundary.run();
};
