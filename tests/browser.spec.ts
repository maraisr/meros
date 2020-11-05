import { test } from 'uvu';
import * as assert from 'uvu/assert';

import * as meros from '../src/browser';
import { configureServer } from './server';

configureServer(test);

test('exports', () => {
	assert.type(meros.meros, 'function');
});

test('can make a call', async (context) => {});

test.run();
