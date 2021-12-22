import { meros } from '../browser';
import { mockResponseBrowser } from './mocks';

import suites from './suites';

suites(meros, mockResponseBrowser);
