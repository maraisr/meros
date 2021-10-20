import type { ServerResponse } from 'node:http';

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

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

// ~> The multipart responder
const serve_data = async (res: ServerResponse) => {
	res.writeHead(200, {
		Connection: 'keep-alive',
		'Content-Type': 'multipart/mixed; boundary="-"',
		'Transfer-Encoding': 'chunked',
	});

	res.write('---');

	for (let letter = 65; letter <= 90; letter++) {
		await new Promise((resolve) => setTimeout(resolve, 150));

		const chunk = Buffer.from(
			JSON.stringify({ letter: String.fromCharCode(letter) }),
			'utf8',
		);
		const data = [
			'',
			'Content-Type: application/json; charset=utf-8',
			'',
			chunk,
		];

		if (letter !== 90) data.push('---');

		res.write(data.join('\r\n'));
	}

	res.write('\r\n-----\r\n');
	res.end();
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
