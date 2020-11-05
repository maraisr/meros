import { generate } from './lib/browser';

export async function meros<T>(res: Response) {
	if (!res.ok || !res.body || res.bodyUsed) {
		// @ts-ignore
		return;
	}

	if (!res.headers.has('content-type')) {
		throw new Error('There was no content-type header');
	}

	const contentType = res.headers.get('content-type');

	if (!/multipart\/mixed/.test(contentType)) {
		return res;
	}

	const boundaryIndex = contentType.indexOf('boundary=');

	return generate<T>(
		res.body,
		'--' +
			(!!~boundaryIndex
				? contentType
						.substring(
							// +9 for 'boundary='.length
							boundaryIndex + 9,
						)
						.trim()
				: '-'),
	);
}
