// @ts-nocheck

import { suite } from '@marais/bench';
import { equal } from 'uvu/assert';

import { makePart, mockResponseBrowser, mockResponseNode, preamble, tail, wrap } from '../test/mocks';

import fetchMultiPartGraphql from 'fetch-multipart-graphql';
import ItMultipart from 'it-multipart';
import { meros as merosBrowser } from '../src/browser';
import { meros as merosNode } from '../src/node';

const fmg = fetchMultiPartGraphql.default;

const parts = [
    { hello: 'world' },
    [{ other: 'world' }, { another: 'world' }],
    {
        massive: {
            nested: {
                world: 'okay',
            },
        },
    },
];

const results = parts.reduce((result, item) => {
    if (Array.isArray(item)) {
        return [...result, ...item];
    }
    return [...result, item];
}, [] as any[]);

const chunks = [
    [preamble, wrap],
    ...parts.map((v, i) => {
        if (Array.isArray(v)) {
            return v.map(v2 => [makePart(v2), wrap]).flat()
        }

        if (i === parts.length - 1) {
            return [makePart(v), tail];
        }

        return [makePart(v), wrap];
    }),
];

const chunk_gen = (async function*() {
    for (const value of chunks) {
        yield value;
    }
});

const do_node_call = mockResponseNode.bind(null, chunk_gen(), '-');
const do_browser_call = mockResponseBrowser.bind(null, chunk_gen(), '-');

global['fetch'] = async function(url, options) {
    return do_browser_call();
};

const verify = (result) => {
    equal(result, results, 'should match reference patch set');
    return true;
};

console.log('Node');
await suite({
    meros() {
        return async () => {
            const response = await do_node_call();
            const parts = await merosNode(response);

            const collection = [];

            for await (let { body } of parts) {
                collection.push(body);
            }

            return collection;
        }
    },
    'it-multipart'() {
        return async () => {
            const response = await do_node_call();
            const parts = await ItMultipart(response);

            const collection = [];

            for await (let part of parts) {
                let data = '';
                for await (const chunk of part.body) {
                    data += String(chunk);
                }
                collection.push(
                    !!~part.headers['content-type'].indexOf('application/json')
                        ? JSON.parse(data)
                        : data,
                );
            }

            return collection;
        }
    },
}, (run) => {
    run(undefined, undefined, verify);
});

console.log('\nBrowser');
await suite({
    meros() {
        return async () => {
        const response = await do_browser_call();
        const parts = await merosBrowser(response);

        const collection = [];

        for await (let { body } of parts) {
            collection.push(body);
        }

        return collection;
        }
    },
    'fetch-multipart-graphql'() {
        return async () => {
            return new Promise((resolve, reject) => {
                let collection: any[] = [];

                fmg('test', {
                    onNext: (parts: any) =>
                        (collection = [...collection, ...parts]),
                    onError: (err: Error) => reject(err),
                    onComplete: () => resolve(collection),
                });
            });
        }
    },
}, (run) => {
    run(undefined, undefined, verify);
});
