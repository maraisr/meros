import { define } from 'bundt/config';

export default define((input, options) => {
	if (input.export === '.') return false;
});
