import * as React from 'react';
import { Suspense, useState } from 'react';
import { unstable_createRoot } from 'react-dom';
import {meros} from 'meros';
import { RelayEnvironmentProvider, useFragment, useLazyLoadQuery, graphql } from 'react-relay/hooks';
import { environment } from './relay';

const SecondVerse = ({ fragRef }) => {
	const data = useFragment(graphql`
		fragment appIndex_SecondLyric on Song {
			secondVerse
		}
	`, fragRef);

	return <p>{data.secondVerse}</p>;
};

const Songs = () => {
	const data = useLazyLoadQuery(graphql`
		query appIndex_Query {
			song {
				firstVerse
				...appIndex_SecondLyric @defer
			}
		}
	`, {}, {
		UNSTABLE_renderPolicy: 'partial'
	});

	return <div>
		<p>{data.song.firstVerse}</p>
		<SecondVerse fragRef={data.song}/>
	</div>;
};

const App = () => {
	const [showSongs, setShowSongs] = useState(false);
	return <RelayEnvironmentProvider environment={environment}>
		<h1>Lets sing some songs</h1>
		<button onClick={() => setShowSongs(true)}>alright lets go!</button>
		<div>
			<Suspense fallback={'loading...'}>
				{showSongs ? <Songs/> : null}
			</Suspense>
		</div>
	</RelayEnvironmentProvider>;
};
(async () => {
	const response = await fetch('/graphql',
		{
			body: JSON.stringify({
				operationName: 'appIndex_Query',
				query: `query appIndex_Query {
  song {
    firstVerse
    ...appIndex_SecondLyric @defer(label: "appIndex_Query$defer$appIndex_SecondLyric")
  }
}

fragment appIndex_SecondLyric on Song {
  secondVerse
}`,
				variables: {},
			}),
			credentials: "include",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			method: "POST",
		});
	const parts = await meros(response);

	for await (const part of parts) {
		const { data, path, hasNext, label } = part;
		console.log({
			data,
			path,
			label,
			extensions: {
				is_final: !hasNext,
			},
		});
	}
})()
/*
unstable_createRoot(document.body)
	.render(<App/>);*/
