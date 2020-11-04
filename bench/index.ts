import '../tests/prelude';

import { Suite } from 'benchmark';

import { makePart, mockFetch } from '../tests/util';

const fetchMulitpartGraphql = require('fetch-multipart-graphql/dist/fetch')
	.fetchImpl;
const meros = require('../dist/index.js').fetchMultipart;

global['fetch'] = mockFetch([{ part: 'a' }, { part: 'b' }].map(makePart));

console.log('\nBenchmark:');
new Suite()
	.add('fetch-multipart-graphql', {
		defer: true,
		fn: (deferred: any) => {
			(async function () {
				await fetchMulitpartGraphql('/test', {
					onNext(_payload: any) {},
					onError(_error: any) {},
					onComplete() {},
				});
				deferred.resolve();
			})();
		},
	})
	.add('meros', {
		defer: true,
		fn: (deferred: any) => {
			(async function () {
				for await (const _payload of meros(() =>
					global['fetch']('/test'),
				)) {
				}
				deferred.resolve();
			})();
		},
	})
	.on('cycle', (e) => console.log(`  ${e.target}`))
	.run({
		async: true,
	});
