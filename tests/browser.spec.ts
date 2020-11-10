import {EventEmitter} from 'events';
import { ServerResponse } from 'http';
import { join } from 'path';
import { chromium, Page } from 'playwright';
import { rollup } from 'rollup';
import typescript from 'rollup-plugin-typescript2';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

import * as meros from '../src/browser';
import { configureServer } from './server';

configureServer(test);

test.before(async (context) => {
	context.browser = await chromium.launch({
		headless: !process.env.DEBUG,
		slowMo: 10,
		devtools: !!process.env.DEBUG,
		args: ['--disable-web-security'],
	});
	const browsingContext = await context.browser.newContext();
	context.page = await browsingContext.newPage();
});
test.after((context) => context.browser.close());

test.before(async (context) => {
	const build = await rollup({
		input: join(__dirname, '../src/browser.ts'),
		plugins: [
			typescript({
				check: false,
				tsconfigOverride: {
					declaration: false,
				},
			}),
		],
	});

	const mod = await build.generate({ format: 'module' });

	context.server.get('meros.mjs', (_req: any, res: ServerResponse) => {
		res.writeHead(200, {
			'Content-Type': `text/javascript`,
		});
		res.end(mod.output.find((i) => i.type === 'chunk').code);
	});
});

test('exports', () => {
	assert.type(meros.meros, 'function');
});

test('can make a call', async (context) => {
	const e = new EventEmitter();

	await (context.page as Page).exposeFunction('COMPLETE', (tests: any[]) => {
		e.emit("done", tests);
	});
	await (context.page as Page).setContent(`
	<html>
	<body></body>
<script type="module">
	import { meros } from "http://localhost:${context.port}/meros.mjs";

	(async function() {
		const parts = await fetch("http://localhost:${context.port}/mock-ep").then(meros);

		const tests = [];
		for await (let part of parts) {
			tests.push(part);
		}

		window.COMPLETE(tests);
	})();

</script>
	</html>
	`);

	const collection: any[] = await new Promise(async (resolve) => {
		e.on('done', resolve);
	})

	assert.is(collection.length, 5);

	assert.equal(collection, [
		{ hello: 'world' },
		{ other: 'world' },
		{ another: 'world' },
		{ massive: { nested: { world: 'okay' } } },
		'should be plain text',
	]);
});

test.run();
