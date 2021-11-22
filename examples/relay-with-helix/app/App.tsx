import type { FC } from 'react';
import * as React from 'react';
import { Suspense } from 'react';
import { graphql, useFragment, useLazyLoadQuery } from 'react-relay/hooks';
import type { App_Query } from './__generated__/App_Query.graphql';
import type { App_SecondLyric$key } from './__generated__/App_SecondLyric.graphql';

const SecondVerse: FC<{ fragRef: App_SecondLyric$key }> = ({ fragRef }) => {
	const data = useFragment(
		graphql`
			fragment App_SecondLyric on Song {
				secondVerse
			}
		`,
		fragRef,
	);

	return <p>{data.secondVerse}</p>;
};
const Songs = () => {
	const data = useLazyLoadQuery<App_Query>(
		graphql`
			query App_Query {
				song {
					firstVerse
					...App_SecondLyric @defer
				}
				alphabet @stream(initial_count: 3) {
					char
				}
			}
		`,
		{},
	);

	return (
		<div>
			<p>{data.song.firstVerse}</p>
			<Suspense fallback={'but....'}>
				<SecondVerse fragRef={data.song} />
			</Suspense>
			<Suspense fallback={'loading...'}>
				{data.alphabet.map((i) => (
					<div key={i.char}>{i.char}</div>
				))}
			</Suspense>
		</div>
	);
};

export const App = () => (
	<>
		<h1>Lets sing some songs</h1>
		<div>
			<Suspense fallback={'loading...'}>
				<Songs />
			</Suspense>
		</div>
	</>
);
