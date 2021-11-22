import { createServer as viteServer } from 'vite';
import polka from 'polka';

import { json } from '@polka/parse';

import {
	shouldRenderGraphiQL,
	renderGraphiQL,
	getGraphQLParameters,
	processRequest,
} from 'graphql-helix';

import { schema } from './schema';

import reactRefresh from '@vitejs/plugin-react-refresh';
import relay from 'vite-plugin-relay';

const vite_app = await viteServer({
	plugins: [reactRefresh(), relay.default],
	define: {
		global: 'globalThis',
	},
	server: {
		middlewareMode: 'html',
	},
});

// ~ Server

const app = polka({
	onError(e, req, res) {
		console.log(e);
		res.end();
	},
});

app.use(json());

app.use('/graphql', async (req, res) => {
	const request = {
		body: req.body,
		headers: req.headers,
		method: req.method,
		query: req.body.query,
	};

	if (shouldRenderGraphiQL(request))
		return void res.end(
			renderGraphiQL({
				defaultQuery: `{
    song {
        ... @defer {
            firstVerse
        }
        ... @defer {
            secondVerse
        }
    }
    alphabet @stream(initialCount: 2) {
        char
    }
}`,
			}),
		);

	let { operationName, query, variables } = getGraphQLParameters(request);

	// BEWARE HACKS
	query = query.replace('initial_count', 'initialCount');

	const result = await processRequest({
		operationName,
		query,
		variables,
		request,
		schema,
	});

	if (result.type === 'RESPONSE') {
		result.headers.forEach(({ name, value }) => res.setHeader(name, value));
		res.writeHead(result.status, {
			'Content-Type': 'application/json',
		});
		res.end(JSON.stringify(result.payload));
	} else if (result.type === 'MULTIPART_RESPONSE') {
		res.writeHead(200, {
			Connection: 'keep-alive',
			'Content-Type': 'multipart/mixed; boundary="-"',
			'Transfer-Encoding': 'chunked',
		});

		req.on('close', () => {
			result.unsubscribe();
		});

		res.write('---');

		await result.subscribe((result) => {
			// Realyism
			if ('hasNext' in result) {
				if (!result.extensions) result.extensions = {};
				result.extensions.is_final = !result.hasNext;
				delete result.hasNext;
			}

			const chunk = Buffer.from(JSON.stringify(result), 'utf8');
			const data = [
				'',
				'Content-Type: application/json; charset=utf-8',
				'',
				chunk,
			];

			if (!result.extensions.is_final) {
				data.push('---');
			}

			res.write(data.join('\r\n'));
		});

		res.write('\r\n-----\r\n');
		res.end();
	}
});

app.use(vite_app.middlewares.handle.bind(vite_app.middlewares));

app.listen(8080, (e) => {
	if (e) throw e;
	console.log('Ready 🕺');
});
