import { meros } from '../src/browser';
import { browserResponse, createTestContext } from './utils';

import suites from './suites';

suites(createTestContext(meros, browserResponse));
