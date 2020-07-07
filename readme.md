# `meros` <sub>From Ancient Greek μέρος (méros, “part”).</sub>

> A fast utility for reading streamed multipart responses.

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
