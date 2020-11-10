import { Suite } from 'benchmark';
import { fetchImpl as fetchMultiPartGraphql } from 'fetch-multipart-graphql/dist/fetch';
import ItMultipart from 'it-multipart';
import { equal } from 'uvu/assert';
import { mockResponseBrowser, mockResponseNode } from '../lib/mocks';
import { meros as merosBrowser } from '../src/browser';
import { meros as merosNode } from '../src/node';

const parts = [
	{ hello: 'world' },
	[{ other: 'world' }, { another: 'world' }],
	{
		massive: {
			nested: {
				world: 'okay',
			},
		},
	}
];

async function runner(name: string, candidates: Record<string, Function>) {
	const n_parts = parts.reduce((result, item) => {
		if (Array.isArray(item)) {
			return [...result, ...item];
		}
		return [...result, item];
	}, [] as any[]);

	const bench = new Suite().on('cycle', (e) => {
		console.log('  ' + e.target);
	});

	console.log('\nValidation :: %s', name);
	for (const [name, fn] of Object.entries(candidates)) {
		const result = await fn();
		try {
			equal(result, n_parts, 'should match reference patch set');
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

const mock_args = [parts, 'abc123', false];

const do_node_call = mockResponseNode.bind(null, ...mock_args);
const do_browser_call = mockResponseBrowser.bind(null, ...mock_args);

global['fetch'] = async function (url, options) {
	return do_browser_call();
};

(async function () {
	await runner('node', {
		meros: async () => {
			const response = await do_node_call();
			const parts = await merosNode(response);

			const collection = [];

			for await (let part of parts) {
				collection.push(part);
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

			for await (let part of parts) {
				collection.push(part);
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
