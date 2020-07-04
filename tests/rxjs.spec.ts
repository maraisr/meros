import './prelude';

import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import { from, lastValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';

import * as fmg from '../src';
import { makePart, mockFetch } from './util';

const intRx = suite('integration::rxjs');

intRx('collect into an array', async () => {
	const payloads = [{ first: 'test' }, { second: 'test' }];

	const result: any[] = [];

	await lastValueFrom(
		from(fmg.fetchMultipart(mockFetch(payloads.map(makePart)))).pipe(
			tap((value) => void result.push(value)),
		),
	);

	assert.equal(result, payloads);
});

intRx.run();
