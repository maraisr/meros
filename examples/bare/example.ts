import type { ServerResponse } from 'node:http';

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

import * as Piecemeal from 'piecemeal/node';

const index_doc = await readFile('./index.html', 'utf8');

const not_found = (res: ServerResponse) => {
	res.statusCode = 404;
	res.end('Not found');
};

// ~> The HTML document
const serve_index = (res: ServerResponse) => {
	res.setHeader('content-type', 'text/html');
	res.end(index_doc);
};

async function* alphabet() {
	for (let letter = 65; letter <= 90; letter++) {
		await new Promise((resolve) => setTimeout(resolve, 150));
		yield { letter: String.fromCharCode(letter) };
	}
}

// ~> The multipart responder
const serve_data = async (res: ServerResponse) => {
	const stream = Piecemeal.stream(alphabet());

	await stream.pipe(res);
};

createServer((req, res) => {
	if (req.method !== 'GET') return void not_found(res);

	if (req.url === '/') return void serve_index(res);
	if (req.url === '/data') return void serve_data(res);

	not_found(res);
}).listen(8080, (e) => {
	if (e) throw e;
	console.log('Ready 🕺');
});
