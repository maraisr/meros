import type { ServerResponse } from 'http';
// @ts-ignore
import polka from 'polka';
import { Callback, Test } from 'uvu';

const boundary = 'abc';

const makeChunk = (
	payload: any,
	newline?: boolean,
	contentType: string = 'application/json',
) => {
	const chunk = Buffer.from(JSON.stringify(payload), 'utf8');
	const returns = [
		'',
		`--${boundary}`,
		`Content-Type: ${contentType}`,
		'Content-Length: ' + String(chunk.length),
		'',
		chunk + '                                          ',
	];

	if (newline) returns.push('');

	return returns.join('\r\n');
};

const patches = [
	makeChunk({ hello: 'world' }),
	[makeChunk({ other: 'world' }), makeChunk({ another: 'world' }, true)].join(
		'',
	),
	makeChunk({
		massive: {
			nested: {
				world: 'okay',
			},
		},
	}),
	makeChunk('should be plain text', true, 'text/plain'),
];

const wait = async (time: number) =>
	new Promise((resolve) => setTimeout(() => resolve(), time));

const server: Callback = async (context) => {
	return new Promise((resolve, reject) => {
		const server = polka()
			.get('/mock-ep', async (_req: any, res: ServerResponse) => {
				res.writeHead(200, {
					Connection: 'keep-alive',
					'Content-Type': `multipart/mixed; boundary=${boundary}`,
					'Transfer-Encoding': 'chunked',
				});

				res.write('preamble');

				for (const patch of patches) {
					const toSend = Math.ceil(patch.length / 9);
					for (let i = 0, o = 0; i < toSend; ++i, o += 9) {
						const ct = patch.substr(o, 9);
						if (process.env.DEBUG) console.log('~> writing ct', ct);
						res.write(ct);
						await wait(1);
					}
				}

				res.write(`\r
--${boundary}--\r
`);
				res.write('epilogue');

				await wait(1);

				res.write(makeChunk({ shouldnt: 'world' }));

				res.end();
			})
			.listen((err: any) => {
				if (err) return reject(err);
				context.port = server.server.address().port;
				context.server = server;
				resolve();
			});
	});
};

export const configureServer = (test: Test) => {
	test.before(server);
	test.after((context) => {
		context.server?.server.close();
	});
};
