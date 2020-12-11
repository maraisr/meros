// @ts-nocheck

import type { IncomingMessage } from 'http';

export function makeChunk(
	payload: any,
	boundary: string,
	contentType: string = 'application/json',
) {
	const chunk = Buffer.from(
		contentType === 'text/plain' ? payload : JSON.stringify(payload),
		'utf8',
	);
	const returns = [
		`Content-Type: ${contentType}`,
		'',
		chunk,
	];

	return returns.join('\r\n');
}

function* makePatches(
	parts: (string | object | (string | object)[])[],
	boundary: string,
	rambo: true,
) {
	const boundary_wrap = `\r\n--${boundary}\r\n`;
	const patches = parts.map((part) => {
		if (Array.isArray(part))
			return part
				.map((p) =>
					makeChunk(
						p,
						boundary,
						typeof p === 'string'
							? 'text/plain'
							: 'application/json',
					),
				)
				.join(boundary_wrap);
		return makeChunk(
			part,
			boundary,
			typeof part === 'string' ? 'text/plain' : 'application/json',
		);
	});

	yield Buffer.from('preamble');
	yield Buffer.from(boundary_wrap);

	const len = patches.length;
	let c = 0;
	for (const patch of patches) {
		if (rambo) {
			const toSend = Math.ceil(patch.length / 9);
			for (let i = 0, o = 0; i < toSend; ++i, o += 9) {
				const ct = patch.substr(o, 9);
				yield Buffer.from(ct);
			}
		} else {
			yield Buffer.from(patch);
		}
		if (c < len-1) {
			yield Buffer.from(boundary_wrap);
		}
		++c;
	}

	yield Buffer.from(`\r\n--${boundary}--\r\n`);

	yield Buffer.from('epilogue\r\n');
	yield Buffer.from(makeChunk({ shouldnt: 'work' }, boundary));
}

export async function mockResponseNode(
	parts: (string | object | (string | object)[])[],
	boundary: string,
	rambo: boolean = true,
): Promise<IncomingMessage> {
	return {
		headers: {
			'content-type': `multipart/mixed; boundary=${boundary}`,
		},
		[Symbol.asyncIterator]: makePatches.bind(
			null,
			parts,
			boundary.replace(/['"]/g, ''),
			rambo,
		),
	};
}

export async function mockResponseBrowser(
	parts: (string | object | (string | object)[])[],
	boundary: string,
	rambo: boolean = true,
): Promise<Response> {
	return {
		headers: new Map([
			['content-type', `multipart/mixed; boundary=${boundary}`],
			['Content-Type', `multipart/mixed; boundary=${boundary}`],
		]),
		status: 200,
		body: {
			getReader() {
				const patches = makePatches(
					parts,
					boundary.replace(/['"]/g, ''),
					rambo,
				);
				return {
					async read() {
						return patches.next();
					},
					releaseLock() {
						// nothing
					},
				};
			},
		},
		ok: true,
		bodyUsed: false,
	};
}
