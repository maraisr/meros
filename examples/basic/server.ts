import polka from 'polka';
import { createServer as viteServer } from 'vite';

import * as Piecemeal from 'piecemeal/node';

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

async function* alphabet() {
	for (let letter = 65; letter <= 90; letter++) {
		await new Promise((resolve) => setTimeout(resolve, 150));
		yield { letter: String.fromCharCode(letter) };
	}
}

app.add('GET', '/data', async (_req, res) => {
	const stream = Piecemeal.stream(alphabet());

	await stream.pipe(res);
});

app.use(vite_app.middlewares.handle.bind(vite_app.middlewares));

app.listen(8080, (e) => {
	if (e) throw e;
	console.log('Ready 🕺');
});
