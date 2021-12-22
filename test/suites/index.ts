import { type Meros, type Responder } from '../mocks';
import { default as API } from './api';
import { default as Body } from './body';
import { default as Boundary } from './boundary';
import { default as Chunking } from './chunking';
import { default as Headers } from './headers';
import { default as UseCases } from './use-cases';

export default (meros: Meros, responder: Responder) => {
	API(meros, responder);
	Boundary(meros, responder);

	Chunking(meros, responder);

	Headers(meros, responder);
	Body(meros, responder);

	UseCases(meros, responder);
}
