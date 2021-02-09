// @ts-nocheck

import { Suite } from 'benchmark';
import { fetchImpl as fetchMultiPartGraphql } from 'fetch-multipart-graphql/dist/fetch';
import ItMultipart from 'it-multipart';
import { equal } from 'uvu/assert';
import { meros as merosBrowser } from '../src/browser';
import { meros as merosNode } from '../src/node';
import { makePart, mockResponseBrowser, mockResponseNode, preamble, tail, wrap } from '../test/mocks';

const parts = [
	{ hello: 'world' },
	[{ other: 'world' }, { another: 'world' }],
	{
		massive: {
			nested: {
				world: 'okay',
			},
		},
	},
];

const results = parts.reduce((result, item) => {
	if (Array.isArray(item)) {
		return [...result, ...item];
	}
	return [...result, item];
}, [] as any[]);

const chunks = [
	[preamble, wrap],
	...parts.map((v, i) => {
		if (Array.isArray(v)) {
			return v.map(v2 => [makePart(v2), wrap]).flat()
		}

		if (i === parts.length - 1) {
			return [makePart(v), tail];
		}

		return [makePart(v), wrap];
	}),
];

const chunk_gen = (async function* () {
	for (const value of chunks) {
		yield value;
	}
});

async function runner(name: string, candidates: Record<string, Function>) {
	const bench = new Suite().on('cycle', (e) => {
		console.log('  ' + e.target);
	});

	console.log('\nValidation :: %s', name);
	for (const [name, fn] of Object.entries(candidates)) {
		const result = await fn();
		try {
			equal(result, results, 'should match reference patch set');
			console.log(`✔`, name);
		} catch (err) {
			console.log('✘', name, `(FAILED @ "${err.message}")`);
		}
	}

	console.log('\nBenchmark :: %s', name);
	for (const [name, fn] of Object.entries(candidates)) {
		bench.add(name.padEnd(25), {
			defer: true,
			fn: async (deferred) => {
				await fn();
				deferred.resolve();
			},
		});
	}

	return new Promise((resolve) => {
		bench.on('complete', resolve);
		bench.run();
	});
}

const do_node_call = mockResponseNode.bind(null, chunk_gen(), '-');
const do_browser_call = mockResponseBrowser.bind(null, chunk_gen(), '-');

global['fetch'] = async function (url, options) {
	return do_browser_call();
};

(async function () {
	await runner('node', {
		meros: async () => {
			const response = await do_node_call();
			const parts = await merosNode(response);

			const collection = [];

			for await (let { body } of parts) {
				collection.push(body);
			}

			return collection;
		},
		'it-multipart': async () => {
			const response = await do_node_call();
			const parts = await ItMultipart(response);

			const collection = [];

			for await (let part of parts) {
				let data = '';
				for await (const chunk of part.body) {
					data += chunk.toString();
				}
				collection.push(
					!!~part.headers['content-type'].indexOf('application/json')
						? JSON.parse(data)
						: data,
				);
			}

			return collection;
		},
	});

	await runner('browser', {
		meros: async () => {
			const response = await do_browser_call();
			const parts = await merosBrowser(response);

			const collection = [];

			for await (let { body } of parts) {
				collection.push(body);
			}

			return collection;
		},
		'fetch-multipart-graphql': async () => {
			return new Promise((resolve, reject) => {
				let collection: any[] = [];

				fetchMultiPartGraphql('test', {
					onNext: (parts: any) =>
						(collection = [...collection, ...parts]),
					onError: (err: Error) => reject(err),
					onComplete: () => resolve(collection),
				});
			});
		},
	});
})();
