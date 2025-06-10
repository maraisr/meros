import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	type Meros,
	type Responder,
	bodies,
	makePart,
	preamble,
	splitString,
	tail,
	test_helper,
	wrap,
} from '../mocks';

export default (meros: Meros, responder: Responder) => {
	const make_test = test_helper.bind(0, meros, responder);

	const UseCase = suite('use-cases');

	UseCase('graphql defer query', async () => {
		const collection = await make_test((push) => {
			push([
				preamble,
				wrap,
				makePart({
					data: {
						user: {
							id: 'VXNlcgpkN2FhNzFjMjctN2I0Yy00MzczLTkwZGItMzhjMjZlNjA4MzNh',
						},
					},
					hasNext: true,
				}),
				wrap,
			]);

			for (let chunk of splitString(
				makePart({
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
			)) {
				push([chunk]);
			}

			push([tail]);
		});

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
		const stream = (async function* () {
			const smiley = Buffer.from('🤔');
			yield Buffer.from('\r\n---\r\n\r\n');
			yield smiley.subarray(0, 2);
			yield smiley.subarray(2);
			yield Buffer.from('\r\n-----\r\n');
		})();

		const response = await responder(stream, '-');

		const chunks = await meros(response);
		const collection = [];

		for await (const chunk of chunks) {
			// TODO: Node yields a buffer here
			collection.push(String(chunk.body));
		}

		assert.equal(collection, ['🤔']);
	});

	UseCase.run();
};
