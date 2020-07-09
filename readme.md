# `meros` <sub>From Ancient Greek μέρος (méros, “part”).</sub>

[![CI](https://img.shields.io/github/workflow/status/maraisr/meros/CI/main)](https://github.com/maraisr/meros/actions?query=workflow:CI+branch:main)
[![codecov](https://img.shields.io/codecov/c/gh/mariasr/meros/main?token=dAoRt2GoQn)](https://codecov.io/gh/maraisr/meros)

> A fast utility for reading streamed multipart/mixed responses on the client.

## ⚙️ Install

```sh
yarn add meros
```

## 🚀 Usage

```ts
import meros from 'meros';

const response = fetch('/fetch-multipart');

// As a simple AsyncGenerator
for await (const part of meros(() => response)) {
	// Do something with this part
}

// Used with rxjs streams
from(meros(() => response)).pipe(
	tap((part) => {
		// Do something with it
	}),
);
```

## 🔎 API

### meros(fetcher: () => Promise\<Response\>): AsyncGenerator;

Returns an async generator that yields on every part. Worth noting that if
multiple parts are present in one chunk, each part will yield independently.

## License

MIT © [Marais Rossouw](https://marais.io)
