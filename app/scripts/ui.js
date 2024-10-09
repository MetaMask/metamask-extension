// Disabled to allow setting up initial state hooks first

// This import sets up global functions required for Sentry to function.
// It must be run first in case an error is thrown later during initialization.
import './lib/setup-initial-state-hooks';
import '../../development/wdyr';

// dev only, "react-devtools" import is skipped in prod builds
import 'react-devtools';

import React from 'react';
import { render } from 'react-dom';
import log from 'loglevel';
import { endTrace, trace, TraceName } from '../../shared/lib/trace';
// import HeavyImport from './heavy-import';

const HeavyImport = React.lazy(() => {
  return trace({ name: 'HeavyImport' }, () => import('./heavy-import'));
});

const container = document.getElementById('app-content');

start().catch(log.error);

function Root() {
  const [loadHeavy, setLoadHeavy] = React.useState(false);

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <div>Lazy Test</div>
      <button onClick={() => setLoadHeavy(true)}>Load Heavy</button>
      {loadHeavy && <HeavyImport />}
    </React.Suspense>
  );
}

async function start() {
  const startTime = performance.now();

  const traceContext = trace({
    name: TraceName.UIStartup,
    startTime: performance.timeOrigin,
  });

  trace({
    name: TraceName.LoadScripts,
    startTime: performance.timeOrigin,
    parentContext: traceContext,
  });

  endTrace({
    name: TraceName.LoadScripts,
    timestamp: performance.timeOrigin + startTime,
  });

  render(<Root />, container);

  endTrace({ name: TraceName.UIStartup });
}
