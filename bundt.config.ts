import { define } from 'bundt/config';

export default define((input, options) => {
	options.target = 'es2019';
	// ignore "index.ts" build attempt
	if (input.export === '.') return false;
});
