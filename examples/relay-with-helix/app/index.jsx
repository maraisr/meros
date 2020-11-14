import * as React from 'react';
import { Suspense, useState } from 'react';
import { unstable_createRoot } from 'react-dom';
import { graphql, RelayEnvironmentProvider, useFragment, useLazyLoadQuery } from 'react-relay/hooks';
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
	`, {});

	return <div>
		<p>{data.song.firstVerse}</p>
		<Suspense fallback={'but....'}>
			<SecondVerse fragRef={data.song}/>
		</Suspense>
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

unstable_createRoot(document.getElementById('app'))
	.render(<App/>);
