# `meros` <small>From Ancient Greek μέρος (méros, “part”).</small>

[![CI](https://img.shields.io/github/workflow/status/maraisr/meros/CI/main)](https://github.com/maraisr/meros/actions?query=workflow:CI+branch:main)
[![codecov](https://img.shields.io/codecov/c/gh/maraisr/meros/main?token=dAoRt2GoQn)](https://codecov.io/gh/maraisr/meros)

> A fast utility for reading streamed multipart/mixed responses.

## ⚙️ Install

```sh
yarn add meros
```

## 🚀 Usage

```ts
// Rely on bundler/environment dection
import { meros } from "meros";

const parts = await fetch("/fetch-multipart").then(meros);

// As a simple AsyncGenerator
for await (const part of parts) {
	// Do something with this part
}

// Used with rxjs streams
from(parts).pipe(
	tap((part) => {
		// Do something with it
	})
);
```

## _Specific Environment_

```ts
// Browser
import { meros } from "meros/browser";
// import { meros } from 'https://cdn.skypack.dev/meros';

const parts = await fetch("/fetch-multipart").then(meros);

// Node
import http from "http";
import { meros } from "meros/node";

const response = await new Promise((resolve) => {
	const request = http.get(`http://localhost:${port}/mock-ep`, (response) => {
		resolve(response);
	});
	request.end();
});

const parts = await meros(response);
```

## 🎒 Notes

This library aims to implements [RFC1341] in its entireity, however there have been some types left out as we aim to be
on the consuming side, than the server side (but we do support Node clients).

-   `content-type` is assumed to stay consistent between parts, and therefore the "fall through" approach is recommended
    and to only be given at the start. Ie only give it `content-type` as a header once, and only for the first chunk.

Please note;

> _Because encapsulation boundaries must not appear in the body parts being
> encapsulated, a user agent must exercise care to choose a unique boundary._
>
> <small>~ [RFC1341] 7.2.1</small>

So be sure to calculate a boundary that can be guaranteed to never exist in the body.

-   We do not support the `/alternative` , `/digest` _or_ `/parallel` subtype at this time.

## 🔎 API

### _Browser_ ~ meros(stream: ReadableStream\<Uint8Array>): AsyncGenerator\<T>;

### _Node_ ~ meros(stream: Readable): AsyncGenerator\<T>;

Returns an async generator that yields on every part. Worth noting that if multiple parts are present in one chunk, each
part will yield independently.

## ❤ Thanks

Special thanks to [Luke Edwards](https://github.com/lukeed) for performance guidance and high level api design.

## License

MIT © [Marais Rossouw](https://marais.io)

[rfc1341]: https://www.w3.org/Protocols/rfc1341/7_2_Multipart.html "The Multipart Content-Type"
