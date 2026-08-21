import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	bodies,
	chunk,
	closingDelimiter,
	collect,
	delimiter,
	part,
	preamble,
	split,
	type Meros,
	type Responder,
} from '../utils';

export default function (meros: Meros, responder: Responder) {
	const UseCase = suite('use-cases');

	UseCase('graphql defer query', async () => {
		const chunks = [
			chunk(
				preamble,
				delimiter(),
				part({
					data: {
						user: {
							id: 'VXNlcgpkN2FhNzFjMjctN2I0Yy00MzczLTkwZGItMzhjMjZlNjA4MzNh',
						},
					},
					hasNext: true,
				}),
				delimiter(),
			),
			...split(
				part({
					label: 'WelcomeQuery$defer$ProjectList_projects_1qwc77',
					path: ['user'],
					data: {
						id: 'VXNlcgpkN2FhNzFjMjctN2I0Yy00MzczLTkwZGItMzhjMjZlNjA4MzNh',
						projects: {
							edges: [
								{
									node: {
										id: 'UHJvamVjdAppMQ==',
										name: 'New project',
										desc: '',
										lastUpdate:
											'2021-12-22T12:57:45.488\u002B03:00',
										__typename: 'Project',
									},
									cursor: 'MA==',
								},
							],
							pageInfo: { endCursor: 'MA==', hasNextPage: false },
						},
					},
					hasNext: false,
				}),
				11,
			),
			closingDelimiter(),
		];

		const collection = await collect(meros(responder(chunks)));

		assert.equal(bodies(collection), [
			{
				data: {
					user: {
						id: 'VXNlcgpkN2FhNzFjMjctN2I0Yy00MzczLTkwZGItMzhjMjZlNjA4MzNh',
					},
				},
				hasNext: true,
			},
			{
				label: 'WelcomeQuery$defer$ProjectList_projects_1qwc77',
				path: ['user'],
				data: {
					id: 'VXNlcgpkN2FhNzFjMjctN2I0Yy00MzczLTkwZGItMzhjMjZlNjA4MzNh',
					projects: {
						edges: [
							{
								node: {
									id: 'UHJvamVjdAppMQ==',
									name: 'New project',
									desc: '',
									lastUpdate:
										'2021-12-22T12:57:45.488\u002B03:00',
									__typename: 'Project',
								},
								cursor: 'MA==',
							},
						],
						pageInfo: { endCursor: 'MA==', hasNextPage: false },
					},
				},
				hasNext: false,
			},
		]);
	});

	UseCase('handles utf-8', async () => {
		const smiley = Buffer.from('🤔');
		const collection = await collect(
			meros(
				responder([
					Buffer.from('\r\n---\r\n\r\n'),
					smiley.subarray(0, 2),
					smiley.subarray(2),
					Buffer.from('\r\n-----\r\n'),
				]),
			),
		);

		assert.equal(bodies(collection), ['🤔']);
	});

	UseCase.run();
}
