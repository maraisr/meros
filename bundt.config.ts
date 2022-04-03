import { define } from 'bundt/config';

export default define((input) => {
	// ignore "index.ts" build attempt
	if (input.export === '.') return false;
});
