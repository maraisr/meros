// Mocks for Node@10
import { TextDecoder, TextEncoder } from 'util';

global['TextDecoder'] = global['TextDecoder'] || TextDecoder;
global['TextEncoder'] = global['TextEncoder'] || TextEncoder;
