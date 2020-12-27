<div align="center">
	<h1 align="center">meros</h1>
	<p align="center"><code>yarn add meros</code> makes reading multipart responses simple</p>
	<hr />
	<span>
		<a href="https://github.com/maraisr/meros/actions?query=workflow:CI+branch:main">
			<img src="https://github.com/maraisr/meros/workflows/CI/badge.svg?query=branch:main"/>
		</a>
		<a href="https://npm.im/meros">
			<img src="https://img.shields.io/npm/dm/meros" alt="downloads"/>
		</a>
		<a href="https://bundlephobia.com/result?p=meros">
			<img src="https://badgen.net/bundlephobia/minzip/meros" alt="size"/>
		</a>
	</span>
</div>

## ⚡ Features

- No dependencies
- Super [performant](#-benchmark)
- Supports _any_<sup>1</sup> `content-type`
- _preamble_ and _epilogue_ don't yield
- Browser-Compatible
- Plugs into existing libraries like Relay and rxjs

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

- `meros` comes from Ancient Greek μέρος méros, meaning "part".

### _Caveats_

- No support the `/alternative` , `/digest` _or_ `/parallel` subtype at this
  time.
- No support for
  [nested multiparts](https://tools.ietf.org/html/rfc1341#appendix-C)

## 🔎 API

### _Browser_

```ts
function meros<T = object>(
  response: Response,
): Promise<
  | Response
  | AsyncGenerator<
      | { json: true; headers: Record<string, string>; body: T }
      | { json: false; headers: Record<string, string>; body: string }
    >
>;
```

### _Node_

```ts
function meros<T = object>(
  response: IncomingMessage,
): Promise<
  | IncomingMessage
  | AsyncGenerator<
      | { json: true; headers: Record<string, string>; body: T }
      | { json: false; headers: Record<string, string>; body: Buffer }
    >
>;
```

Returns an async generator that yields on every part. Worth noting that if
multiple parts are present in one chunk, each part will yield independently.

> If the `content-type` is **NOT** a multipart, then it will resolve with the
> response argument. Or really any unhandled cases, we'll resolve with the
> response.
>
> <details>
> <summary>Example on how to handle this case</summary>
>
> ```ts
> import { meros } from 'meros';
>
> const response = await fetch('/fetch-multipart'); // Assume this returns json
> const parts = await meros(response);
>
> if (parts[Symbol.asyncIterator] < 'u') {
>   for await (const part of parts) {
>     // Do something with this part
>   }
> } else {
>   const data = await parts.json();
> }
> ```
>
> </details>

## 💨 Benchmark

```
Validation :: node
✔ meros
✘ it-multipart (FAILED @ "should match reference patch set")

Benchmark :: node
  meros                     x 27,567 ops/sec ±2.04% (77 runs sampled)
  it-multipart              x 16,064 ops/sec ±1.20% (79 runs sampled)

Validation :: browser
✔ meros
✘ fetch-multipart-graphql (FAILED @ "should match reference patch set")

Benchmark :: browser
  meros                     x 30,077 ops/sec ±0.92% (80 runs sampled)
  fetch-multipart-graphql   x 25,551 ops/sec ±1.44% (81 runs sampled)
```

> Ran with Node v15.1.0

## ❤ Thanks

Special thanks to [Luke Edwards](https://github.com/lukeed) for performance
guidance and high level api design.

## License

MIT © [Marais Rossouw](https://marais.io)

<details>
<summary>Footnote</summary>

> 1: By default, we'll look for JSON, and parse that for you. If not, we'll give
> you the body as what was streamed.

</details>

[rfc1341]: https://tools.ietf.org/html/rfc1341 'The Multipart Content-Type'
