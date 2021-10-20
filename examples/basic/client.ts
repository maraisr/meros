import { meros } from 'meros';

async function run() {
	const app = document.querySelector('#app');

	const parts = await fetch('/data').then((r) =>
		meros<{ letter: string }>(r),
	);

	for await (let part of parts) {
		const el = document.createElement('div');
		el.innerText = part.body.letter;
		app.appendChild(el);
	}
}

if (document.readyState !== 'complete') run();
else window.addEventListener('load', run);
