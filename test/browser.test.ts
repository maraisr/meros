import { meros } from '../src/browser';
import { mockResponseBrowser } from './mocks';

import suites from './suites';

suites(meros, mockResponseBrowser);
