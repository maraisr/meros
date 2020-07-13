import '../tests/prelude';

import { Suite } from 'benchmark';

import { makePart, mockFetch } from '../tests/util';

console.log('\nLoad times: ');

console.time('fetch-multipart-graphql');
const fetchMulitpartGraphql = require('fetch-multipart-graphql/dist/fetch')
	.fetchImpl;
console.timeEnd('fetch-multipart-graphql');

console.time('meros');
const meros = require('../dist/index.js').fetchMultipart;
console.timeEnd('meros');

global['fetch'] = mockFetch([{ part: 'a' }, { part: 'b' }].map(makePart));

console.log('\nBenchmark:');
new Suite()
	.add('fetchMulitpartGraphql', {
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
	.add('fmg', {
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
