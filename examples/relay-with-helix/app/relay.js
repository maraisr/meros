import { Environment, Network, Observable, RecordSource, Store } from 'relay-runtime';
import { meros } from 'meros';

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
			const response = await fetch('http://localhost:3004/graphql',
				{
					body: JSON.stringify({
						query: params.text,
						variables,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
					method: 'POST',
				});
			const parts = await meros(response);

			for await (const { body, json } of parts) {
				if (!json) {
					sink.error(new Error('Failed to parse part as json.'));
					break;
				}

				const { data, path, hasNext, label } = body;
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
	network,
	store,
	log(event) {
		console.log(event);
	},
});
