import polka from 'polka';
import { createServer as viteServer } from 'vite';

const vite_app = await viteServer({
	resolve: {
		mainFields: ['browser', 'main'],
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

const make_part = (payload: any, end?: boolean) => {
	const chunk = Buffer.from(JSON.stringify(payload), 'utf8');
	const data = [
		'',
		'Content-Type: application/json; charset=utf-8',
		'',
		chunk,
	];

	if (!end) data.push('---');

	return data.join('\r\n');
};

async function* alphabet() {
	for (let letter = 65; letter <= 90; letter++) {
		await new Promise((resolve) => setTimeout(resolve, 150));
		yield [{ letter: String.fromCharCode(letter) }, letter === 90];
	}
}

app.add('GET', '/data', async (_req, res) => {
	res.writeHead(200, {
		Connection: 'keep-alive',
		'Content-Type': 'multipart/mixed; boundary="-"',
		'Transfer-Encoding': 'chunked',
	});

	res.write('---');

	for await (const [payload, is_end] of alphabet())
		res.write(make_part(payload, is_end));

	res.write('\r\n-----\r\n');
	res.end();
});

app.use(vite_app.middlewares.handle.bind(vite_app.middlewares));

app.listen(8080, (e) => {
	if (e) throw e;
	console.log('Ready 🕺');
});
