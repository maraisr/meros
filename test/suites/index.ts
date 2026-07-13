import type { TestContext } from '../utils';

import { default as API } from './api';
import { default as Boundary } from './boundary';
import { default as Chunking } from './chunking';
import { default as Headers } from './headers';
import { default as Body } from './body';
import { default as Binary } from './binary';
import { default as UseCases } from './use-cases';

export default (test: TestContext) => {
	API(test);
	Boundary(test);

	Chunking(test);

	Headers(test);
	Body(test);

	Binary(test);

	UseCases(test);
};
