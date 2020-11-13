# `meros` &middot; <small>From Ancient Greek μέρος (méros, "part").</small>

[![CI](https://img.shields.io/github/workflow/status/maraisr/meros/CI/main)](https://github.com/maraisr/meros/actions?query=workflow:CI+branch:main)
[![codecov](https://img.shields.io/codecov/c/gh/maraisr/meros/main?token=dAoRt2GoQn)](https://codecov.io/gh/maraisr/meros)

> A fast (761B) utility for reading streamed multipart/mixed responses.

## ⚡ Features

-   ✅ No dependencies
-   ✅ Super [performant](#-benchmark)
-   ✅ Supports _any_<sup>1</sup> `content-type`
-   ✅ Supports _fall through_<sup>2</sup> `content-type`'s
-   ✅ Supports `content-length`<sup>3</sup>
-   ✅ _preamble_ and _epilogue_ don't yield
-   ✅ Browser-Compatible
-   ✅ Plugs into existing libraries like Relay and rxjs

## ⚙️ Install

```sh
yarn add meros
```

## 🚀 Usage

```ts
// Rely on bundler/environment dection
import { meros } from 'meros';

const parts = await fetch('/fetch-multipart').then(meros);

// As a simple Async Generator
for await (const part of parts) {
	// Do something with this part
}

// Used with rxjs streams
from(parts).pipe(
	tap((part) => {
		// Do something with it
	}),
);
```

## _Specific Environment_

```ts
// Browser
import { meros } from 'meros/browser';
// import { meros } from 'https://cdn.skypack.dev/meros';

const parts = await fetch('/fetch-multipart').then(meros);

// Node
import http from 'http';
import { meros } from 'meros/node';

const response = await new Promise((resolve) => {
	const request = http.get(`http://my-domain/mock-ep`, (response) => {
		resolve(response);
	});
	request.end();
});

const parts = await meros(response);
```

## 🎒 Notes

This library aims to implement [RFC1341] in its entirety, however we aren't
there yet. That being said, you may very well use this library in other
scenarios like streaming in file form uploads.

Please note; be sure to define a boundary that can be guaranteed to never
collide with things from the body:

> _Because encapsulation boundaries must not appear in the body parts being
> encapsulated, a user agent must exercise care to choose a unique boundary._
>
> <small>~ [RFC1341] 7.2.1</small>

### _Caveats_

-   No support the `/alternative` , `/digest` _or_ `/parallel` subtype at this
    time.
-   No support for
    [nested multiparts](https://tools.ietf.org/html/rfc1341#appendix-C)

## 🔎 API

### _Browser_

```ts
function meros<T = unknown>(
	response: Response,
): Promise<Response | AsyncGenerator<T>>;
```

### _Node_

```ts
function meros<T = unknown>(
	response: IncomingMessage,
): Promise<IncomingMessage | AsyncGenerator<T>>;
```

Returns an async generator that yields on every part. Worth noting that if
multiple parts are present in one chunk, each part will yield independently.

> If the `content-type` is **NOT** a multipart, then it will resolve with the
> response argument.

<details>
<summary>Example on how to handle this case</summary>

```ts
import { meros } from 'meros';

const response = await fetch('/fetch-multipart'); // Assume this returns json
const parts = await meros(response);

if (parts[Symbol.asyncIterator] < 'u') {
	for await (const part of parts) {
		// Do something with this part
	}
} else {
	const data = await parts.json();
}
```

</details>

## 💨 Benchmark

> Ran with Node v15.1.0

```
Validation :: node
✔ meros
✘ it-multipart (FAILED @ "should match reference patch set")

Benchmark :: node
  meros                     x 32,900 ops/sec ±0.89% (78 runs sampled)
  it-multipart              x 16,033 ops/sec ±0.98% (77 runs sampled)

Validation :: browser
✔ meros
✘ fetch-multipart-graphql (FAILED @ "should match reference patch set")

Benchmark :: browser
  meros                     x 28,226 ops/sec ±1.20% (80 runs sampled)
  fetch-multipart-graphql   x 14,835 ops/sec ±0.90% (78 runs sampled)
```

<details>
<summary><i>Reference patch set</i></summary>

```
content-type: "multipart/mixed; boundary=abc123"
```

```
preamble
--abc123
Content-Type: application/json
Content-Length: 17

{"hello":"world"}

--abc123
Content-Type: application/json
Content-Length: 17

{"other":"world"}

--abc123
Content-Type: application/json
Content-Length: 19

{"another":"world"}

--abc123
Content-Type: application/json
Content-Length: 39

{"massive":{"nested":{"world":"okay"}}}

--abc123--
epilogue
--abc123
Content-Type: application/json
Content-Length: 19

{"shouldnt":"work"}
```

</details>

## ❤ Thanks

Special thanks to [Luke Edwards](https://github.com/lukeed) for performance
guidance and high level api design.

## License

MIT © [Marais Rossouw](https://marais.io)

<details>
<summary>Footnote</summary>

> 1: By default, we'll look for JSON, and parse that for you. If not, we'll give
> you the body as what was streamed.</small>
>
> 2: Unlike the spec assuming `application/octet-stream` for untyped chunks, we
> assume whatever `content-type` we last encountered. See
> [RFC1341 Section 4](https://tools.ietf.org/html/rfc1341#section-4)
>
> 3: If not given, everything from the body through boundary will yield

</details>

[rfc1341]: https://tools.ietf.org/html/rfc1341 'The Multipart Content-Type'
