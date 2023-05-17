// @ts-nocheck

// Mocks for Node@10
const { TextDecoder, TextEncoder } = require('util');

global['TextDecoder'] = global['TextDecoder'] || TextDecoder;
global['TextEncoder'] = global['TextEncoder'] || TextEncoder;
