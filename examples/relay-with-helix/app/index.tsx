import * as React from 'react';
import { createRoot } from 'react-dom';
import { RelayEnvironmentProvider } from 'react-relay/hooks';
import { App } from './App';
import { getEnvironment } from './relay';

const environment = getEnvironment();

createRoot(document.getElementById('app')).render(
	<RelayEnvironmentProvider environment={environment}>
		<App />
	</RelayEnvironmentProvider>,
);
