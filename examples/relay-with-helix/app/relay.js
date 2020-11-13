import { Environment, Network, Observable, RecordSource, Store } from 'relay-runtime';
import { meros } from 'meros/browser';

const STORE_ENTRIES = 150;
const STORE_CACHE_RELEASE_TIME = 2 * 60 * 1000; // 2 mins
const source = new RecordSource();
const store = new Store(source, {
	gcReleaseBufferSize: STORE_ENTRIES,
	queryCacheExpirationTime: STORE_CACHE_RELEASE_TIME,
});

function fetchQuery(params, variables, _cacheConfig) {
	return Observable.create(sink => {
		(async () => {
			const response = await fetch('/graphql',
				{
					body: JSON.stringify({
						query: params.text,
						variables,
					}),
					credentials: "include",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					method: "POST",
				});
			const parts = await meros(response);

			for await (const part of parts) {
				const { data, path, hasNext, label } = part;
				sink.next({
					data,
					path,
					label,
					extensions: {
						is_final: !hasNext,
					},
				});
			}

			sink.complete();
		})();
	});
}

const network = Network.create(fetchQuery);

export const environment = new Environment({
	treatMissingFieldsAsNull: true,
	configName: 'standard',
	log(event) {
		console.log(event);
	},
	network,
	store,
});
