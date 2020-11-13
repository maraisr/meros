const polka = require('polka');
const morgan = require('morgan');
const {json} = require('@polka/parse');
const cors = require('cors')();
const serve = require('sirv')('dist');
const {
	getGraphQLParameters,
	processRequest,
	renderGraphiQL,
	shouldRenderGraphiQL,
} = require('graphql-helix');
const {
	GraphQLList,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
} = require('graphql');

const schema = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'Query',
		fields: () => ({
			alphabet: {
				type: new GraphQLList(GraphQLString),
				resolve: async function* () {
					for (let letter = 65; letter <= 90; letter++) {
						await new Promise((resolve) => setTimeout(resolve, 1000));
						yield String.fromCharCode(letter);
					}
				},
			},
			song: {
				type: new GraphQLObjectType({
					name: 'Song',
					fields: () => ({
						firstVerse: {
							type: GraphQLString,
							resolve: () => 'Now I know my ABC\'s.',
						},
						secondVerse: {
							type: GraphQLString,
							resolve: () =>
								new Promise((resolve) =>
									setTimeout(
										() => resolve('Next time won\'t you sing with me?'),
										5000,
									),
								),
						},
					}),
				}),
				resolve: () =>
					new Promise((resolve) => setTimeout(() => resolve('goodbye'), 1000)),
			},
		}),
	}),
});

polka()
	.use(morgan('[:method] :url :status :res[content-type] in :response-time ms'), serve, cors, json())
	.use('/graphql', async (req, res) => {
		const request = {
			body: req.body,
			headers: req.headers,
			method: req.method,
			query: req.query,
		};

		if (shouldRenderGraphiQL(request)) {
			res.end(renderGraphiQL());
		} else {
			const { operationName, query, variables } = getGraphQLParameters(request);

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
					'Content-Type': 'multipart/mixed; boundary=abc123',
					'Transfer-Encoding': 'chunked',
				});

				req.on('close', () => {
					result.unsubscribe();
				});

				res.write('preamble');

				await result.subscribe(result => {
					const chunk = Buffer.from(JSON.stringify(result), 'utf8');
					const data = [
						'',
						'--abc123',
						'Content-Type: application/json; charset=utf-8',
						'Content-Length: ' + String(chunk.length),
						'',
						chunk,
						'',
					].join('\r\n');
					res.write(data);
				});

				res.end('\r\n--abc123--\r\n');
			}
		}
	})
	.listen(3004, err => {
		if (err) throw err;
		console.log(`> Running on localhost:3004`);
	});
