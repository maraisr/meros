import '../tests/prelude';

import { Suite } from 'benchmark';

import { makePart, mockFetch } from '../tests/util';
// @ts-ignore
import { fetchImpl as fetchMulitpartGraphql } from 'fetch-multipart-graphql/dist/fetch';
import { fetchMultipart } from '../dist';

global['fetch'] = mockFetch([{ part: 'a' }, { part: 'b' }].map(makePart));

new Suite()
	.add('fetchMulitpartGraphql', {
		defer: true,
		fn: async (deferred:any) => {
			await fetchMulitpartGraphql('/test', {
				onNext(_payload: any) {
					// consume payload.
				},
				onError(_error: any) {
				},
				onComplete() {
				},
			});
			deferred.resolve();
		},
	})
	.add('fmg', {
		defer: true,
		fn: async (deferred: any) => {
			for await (const _payload of fetchMultipart(() => global['fetch']('/test'))) {
				// consume payload.
			}
			deferred.resolve();
		},
	})
	.on('cycle', e => console.log('  ' + e.target))
	.run();
