import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import {
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
  openSync,
  closeSync,
  existsSync,
} from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createHash } from 'node:crypto';

const { browserPid, isColdMode }: typeof import('./browser-process') =
  await import(new URL('./browser-process.ts', import.meta.url).href);

const configPath = process.env.PERPS_MEASUREMENT_CONFIG;
assert(
  configPath,
  'Set PERPS_MEASUREMENT_CONFIG to the non-secret measurement config',
);
const config: {
  artifactsDir: string;
  runtimeDir: string;
  cdpPort: number;
  extensionId: string;
  accounts?: Record<string, string>;
  requiredSpans?: Record<string, Record<string, string[]>>;
} = JSON.parse(readFileSync(configPath, 'utf8'));
const root = path.resolve(config.artifactsDir);
const runtime = path.resolve(config.runtimeDir);
const port = config.cdpPort;
const { extensionId } = config;
assert(Number.isInteger(port) && port > 0 && port < 65536);
assert(/^[a-p]{32}$/u.test(extensionId));
const repo = process.cwd();
const harness = process.env.MM_HARNESS_BIN ?? 'mm-harness';

type Target = {
  id: string;
  type: string;
  url: string;
  webSocketDebuggerUrl: string;
};
type Message = {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: unknown;
};
const NODE_FIELDS = { testId: 'test_id', timeoutMs: 'timeout_ms' } as const;
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
async function run(command: string, args: string[], log: string) {
  const fd = openSync(log, 'a');
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: repo,
        stdio: ['ignore', fd, fd],
      });
      child.on('error', reject);
      child.on('exit', (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`${command} exit ${code}; ${log}`)),
      );
    });
  } finally {
    closeSync(fd);
  }
}
async function targets(): Promise<Target[]> {
  return (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
}
async function connect(target: Target) {
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise<void>((r, j) => {
    socket.onopen = () => r();
    socket.onerror = j;
  });
  let id = 0;
  const pending = new Map<
    number,
    {
      resolve: (v: Record<string, unknown>) => void;
      reject: (e: unknown) => void;
    }
  >();
  const listeners: ((m: Message) => void)[] = [];
  socket.onmessage = ({ data }) => {
    const m: Message = JSON.parse(String(data));
    if (m.id) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) {
        p?.reject(m.error);
      } else {
        p?.resolve(m.result ?? {});
      }
    } else {
      listeners.forEach((f) => f(m));
    }
  };
  const call = (method: string, params: Record<string, unknown> = {}) =>
    new Promise<Record<string, unknown>>((resolve, reject) => {
      id += 1;
      const requestId = id;
      if (socket.readyState !== WebSocket.OPEN) {
        reject(Error(`CDP target disconnected: ${target.id}`));
        return;
      }
      const timer = setTimeout(() => {
        pending.delete(requestId);
        reject(Error(`CDP timeout ${method} target ${target.id}`));
      }, 8000);
      pending.set(requestId, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
      socket.send(JSON.stringify({ id: requestId, method, params }));
    });
  socket.onclose = () => {
    for (const entry of pending.values()) {
      entry.reject(Error(`CDP target closed: ${target.id}`));
    }
    pending.clear();
  };
  const evaluate = async (expression: string) => {
    const r = await call('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    assert(!r.exceptionDetails, JSON.stringify(r.exceptionDetails));
    return (r.result as { value: unknown }).value;
  };
  return { socket, listeners, call, evaluate };
}
async function pageTarget(): Promise<Target> {
  for (let i = 0; i < 100; i++) {
    const p = (await targets()).find(
      (t) => t.type === 'page' && t.url.includes(`${extensionId}/home.html`),
    );
    if (p) {
      return p;
    }
    await delay(100);
  }
  throw new Error('Extension page missing');
}
async function waitForHomeControl() {
  const page = await connect(await pageTarget());
  try {
    for (let i = 0; i < 200; i++) {
      if (
        await page.evaluate(
          `!!document.querySelector('[data-testid="bottom-nav-home"]')?.getClientRects().length`,
        )
      ) {
        return;
      }
      await delay(100);
    }
    throw new Error('Unlock did not render the Home navigation control');
  } finally {
    page.socket.close();
  }
}
async function singlePage() {
  const keep = await pageTarget();
  const cdp = await connect(keep);
  const closed: string[] = [];
  try {
    await cdp.call('Page.bringToFront');
    assert.equal(
      (await targets()).filter(
        (t) => t.type === 'page' && t.url.includes(extensionId),
      ).length,
      1,
      'Exactly one extension page required',
    );
    for (let i = 0; i < 50; i++) {
      if (
        (await targets()).filter(
          (t) =>
            t.type === 'page' && t.url.includes(`${extensionId}/home.html`),
        ).length === 1
      ) {
        break;
      }
      await delay(100);
    }
    assert.equal(
      (await targets()).filter(
        (t) => t.type === 'page' && t.url.includes(`${extensionId}/home.html`),
      ).length,
      1,
      'Exactly one extension Home page required',
    );
    return { kept: keep.id, closed };
  } finally {
    cdp.socket.close();
  }
}
const formatterSource = stripTypeScriptTypes(
  readFileSync(path.join(repo, 'shared/lib/perps-formatters.ts'), 'utf8'),
  { mode: 'strip' },
).replace(/^export /gmu, '');
assert(!/^import /mu.test(formatterSource), 'Formatter must stay portable');
const observationSource = stripTypeScriptTypes(
  readFileSync(new URL('./market-observation.ts', import.meta.url), 'utf8'),
  { mode: 'strip' },
).replace(/^export /gmu, '');
const collector = `(() => {
  const Intl = document.__perpsIntl;
  ${formatterSource}
  ${observationSource}
  if (window.__perpsMeasure) window.__perpsMeasure.stop = true;
  const p = { stop:false, epoch:performance.timeOrigin, unlock:null, unlocked:null, entry:null, ready:null, firstRows:null, dataReady:null, snapshots:[], backendReady:false };
  window.__perpsMeasure = p; p.visibility=[]; p.onVisibility=()=>p.visibility.push({at:performance.now(),state:document.visibilityState});document.addEventListener('visibilitychange',p.onVisibility);
  p.onClick = e => {
    if(e.target.closest('[data-testid="unlock-submit"]') && p.unlock===null) p.unlock=performance.now();
    if(e.target.closest('[data-testid^="multichain-account-cell-name-"]') && p.mode==='account'){p.switchClick=performance.now();p.entry=p.switchClick;}
    if(e.target.closest('[data-testid="bottom-nav-perps"], [data-testid="account-overview__perps-tab"]')){p.perpsClick=performance.now();if(p.mode!=='account')p.entry=p.perpsClick;}
  }; document.addEventListener('click', p.onClick, {capture:true});
  const frame = () => {
    if(p.stop) return;
    const m = globalThis.stateHooks?.getPerpsStreamManager?.();
    const s = globalThis.stateHooks?.store?.getState();
    const now=performance.now();
    if(s?.metamask?.isUnlocked && p.unlocked===null) p.unlocked=now;
    const markets=m?.markets.getCachedData()??[];
    const prices=m?.prices.getCachedData()??[];
    const symbols=new Set(markets.map(x=>x.symbol));
    const pricesReady=prices.some(x=>symbols.has(x.symbol)&&Number(x.price)>0);
    const selected=s?.metamask?.internalAccounts?.accounts?.[s?.metamask?.internalAccounts?.selectedAccount]?.address;
    const dataReady=(!p.expectedAddress || selected?.toLowerCase()===p.expectedAddress.toLowerCase()) && !!selected && m?.getCurrentAddress()?.toLowerCase()===selected.toLowerCase() && !!m?.isInitialized() && markets.length>0 && pricesReady && m?.positions.hasCachedData() && m?.orders.hasCachedData() && m?.account.hasCachedData();
    if(dataReady && p.dataReady===null) p.dataReady=now;
    const rows=[...document.querySelectorAll('button[data-testid]')].filter(e=>/^(perps-watchlist-(?!header)|explore-markets-|market-row-(?!ticker-|skeleton))/.test(e.getAttribute('data-testid'))&&e.getClientRects().length);
    const rowProof=observeMarketRows(rows.map(e=>({testId:e.getAttribute('data-testid'),displayed:e.querySelector('.text-right')?.textContent?.trim()??''})),markets,prices,price=>formatPerpsFiat(price,{ranges:PRICE_RANGES_UNIVERSAL}));
    if(p.entry!==null && rowProof.some(row=>row.priced) && p.firstRows===null) p.firstRows=now;
    if(document.visibilityState==='visible' && p.entry!==null && rows.length && dataReady && p.ready===null) {
      p.lastRowsProof={at:now,rows:rowProof};
      if(!p.firstRowsProof)p.firstRowsProof={at:now,rows:rowProof};
      if(!allMarketRowsMatch(rowProof)) {document.__perpsRAF(frame);return;}
      p.ready=now;p.rowProof=rowProof;p.managerAddress=m.getCurrentAddress(); p.selectedAddress=selected; p.final={visibility:document.visibilityState,markets:markets.length,prices:prices.length,rows:rows.map(e=>({testId:e.getAttribute('data-testid'),text:e.innerText})),route:location.hash,terminalFlag:s?.metamask?.remoteFeatureFlags?.perpsTerminalBackendEnabled};
    }
    document.__perpsRAF(frame);
  }; document.__perpsRAF(frame);
})()`;
function verifyBuild(arm: string) {
  const runtimeProvenance = path.join(root, `${arm}-runtime-provenance.json`);
  const provenance = JSON.parse(
    readFileSync(
      existsSync(runtimeProvenance)
        ? runtimeProvenance
        : path.join(root, `${arm}-build-provenance.json`),
      'utf8',
    ),
  ) as { files: { file: string; sha256: string }[] };
  const buildRoot = path.join(runtime, 'runtime-dist');
  const entries = readdirSync(buildRoot, {
    recursive: true,
    withFileTypes: true,
  });
  assert(
    entries.every((entry) => !entry.isSymbolicLink()),
    'Runtime build contains symlinks',
  );
  const actualFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path
        .relative(buildRoot, path.join(entry.parentPath, entry.name))
        .split(path.sep)
        .join('/'),
    )
    .sort();
  assert(provenance.files.length > 0, 'Empty build provenance');
  assert.deepEqual(
    actualFiles,
    provenance.files.map((entry) => entry.file).sort(),
    'Runtime file inventory drift',
  );
  for (const entry of provenance.files) {
    assert.equal(
      createHash('sha256')
        .update(readFileSync(path.join(runtime, 'runtime-dist', entry.file)))
        .digest('hex'),
      entry.sha256,
      `Runtime build drift: ${entry.file}`,
    );
  }
  return {
    sourceRef: (provenance as { sourceRef?: string }).sourceRef,
    provenanceSha256: createHash('sha256')
      .update(JSON.stringify(provenance))
      .digest('hex'),
  };
}
async function sample(
  arm: string,
  mode: string,
  index: string,
  accountName?: string,
) {
  const out = path.join(root, `${arm}-${mode}-${index}`);
  mkdirSync(out, { recursive: true });
  const cold = isColdMode(mode);
  assert(
    !cold || existsSync(path.join(out, 'prior-browser.pid')),
    'Cold setup missing prior-browser.pid; use run-loading-cohort.ts to stop and relaunch the verified browser first',
  );
  const initialPageNormalization = await singlePage();
  const beforePid = cold
    ? readFileSync(path.join(out, 'prior-browser.pid'), 'utf8').trim()
    : await browserPid(port);
  const afterPid = await browserPid(port);
  if (cold) {
    assert.notEqual(
      beforePid,
      afterPid,
      'A cold sample requires actual browser replacement',
    );
  }
  const initialWorkers = (await targets())
    .filter(
      (target) =>
        target.type === 'service_worker' && target.url.includes(extensionId),
    )
    .map((target) => target.id)
    .sort();
  const setupPage = await connect(await pageTarget());
  try {
    assert.equal(
      await setupPage.evaluate(
        'globalThis.stateHooks?.store?.getState()?.metamask?.isUnlocked',
      ),
      !cold,
      'Wallet lock state does not match lifecycle contract',
    );
  } finally {
    setupPage.socket.close();
  }
  if (!cold) {
    const check = await connect(await pageTarget());
    try {
      assert(
        await check.evaluate(
          'globalThis.stateHooks.getPerpsStreamManager().isInitialized() && globalThis.stateHooks.getPerpsStreamManager().markets.getCachedData().length>0',
        ),
        'Warm lifecycle requires a previously loaded session',
      );
    } finally {
      check.socket.close();
    }
  }
  verifyBuild(arm);
  writeFileSync(
    path.join(out, 'lifecycle.json'),
    JSON.stringify(
      {
        beforePid,
        afterPid,
        initialPageNormalization,
        targets: (await targets())
          .filter((t) => t.url.includes(extensionId))
          .map((t) => ({ id: t.id, type: t.type, url: t.url })),
        profile: path.join(runtime, 'chrome-profile'),
        build: path.join(runtime, 'runtime-dist'),
      },
      null,
      2,
    ),
  );
  const page = await connect(await pageTarget());
  const connections = [page];
  const requests: Record<string, unknown>[] = [];
  const pending = new Map<string, Record<string, unknown>>();
  try {
    for (let i = 0; i < 100; i++) {
      if (await page.evaluate('!!globalThis.stateHooks?.store')) {
        break;
      }
      await delay(100);
    }
    await page.call('Page.enable');
    const hook = await page.call('Page.addScriptToEvaluateOnNewDocument', {
      source:
        'document.__perpsRAF=window.requestAnimationFrame.bind(window);document.__perpsIntl=Intl;',
    });
    if (cold) {
      await page.call('Page.reload');
      await delay(500);
      for (let i = 0; i < 100; i++) {
        if (
          await page.evaluate(
            '!!globalThis.stateHooks?.store && !!document.__perpsRAF',
          )
        ) {
          break;
        }
        await delay(100);
      }
    }
    await page.call('Page.removeScriptToEvaluateOnNewDocument', {
      identifier: hook.identifier,
    });
    if (!cold) {
      assert(
        await page.evaluate(
          'typeof document.__perpsRAF==="function" && !!document.__perpsIntl',
        ),
        'Warm sample requires observer installed before initialization',
      );
    }
    await page.evaluate(collector);
    await page.evaluate(`window.__perpsMeasure.mode=${JSON.stringify(mode)}`);
    await page.evaluate(
      `window.__perpsMeasure.requiredSpans=${JSON.stringify(config.requiredSpans?.[arm]?.[mode] ?? [])}`,
    );
    if (mode === 'account') {
      assert(accountName, 'Existing UI account label required');
      const accountId = config.accounts?.[accountName];
      assert(accountId, 'Verified internal account ID required');
      await page.evaluate(
        `(() => {const accounts=globalThis.stateHooks.store.getState().metamask.internalAccounts;if(accounts.selectedAccount===${JSON.stringify(accountId)})throw Error('Account-switch sample requires a different initial account');const a=Object.values(accounts.accounts).find(a=>a.id===${JSON.stringify(accountId)});if(!a)throw Error('Expected existing account unavailable');window.__perpsMeasure.expectedAddress=a.address;})()`,
      );
    }
    await page.evaluate(
      `(() => {const sdk=globalThis.sentry, client=sdk?.getClient?.(); const p=window.__perpsMeasure; p.spans=[];p.removeSdk=[];p.sdkAvailable=!!client?.on;if(!client?.on)return; for(const phase of ['spanStart','spanEnd'])p.removeSdk.push(client.on(phase,span=>{const s=sdk.spanToJSON(span);if(!s.description?.startsWith('Perps '))return;p.spans.push({phase,name:s.description,id:s.span_id,start:s.start_timestamp,end:s.timestamp,op:s.op,data:{...s.data},tags:{...sdk.getIsolationScope().getScopeData().tags}});}));})()`,
    );
    if (!cold) {
      await page.evaluate('window.__perpsMeasure.backendReady=true');
    }
    for (const worker of (await targets()).filter(
      (t) => t.type === 'service_worker' && t.url.includes(extensionId),
    )) {
      connections.push(await connect(worker));
    }
    for (const c of connections) {
      c.listeners.push((m) => {
        const p = m.params as Record<string, unknown>;
        if (m.method === 'Network.requestWillBeSent') {
          const request = p.request as { url: string; method: string };
          const url = new URL(request.url);
          if (!/^https?:$/u.test(url.protocol)) {
            return;
          }
          const r = {
            requestId:
              c === page
                ? `page:${String(p.requestId)}`
                : `worker:${String(p.requestId)}`,
            url:
              url.origin +
              url.pathname.replace(/\/v3\/[^/]+/gu, '/v3/[redacted]'),
            method: request.method,
            start: p.timestamp,
            wall: p.wallTime,
          };
          pending.set(
            (c === page ? 'page:' : 'worker:') + String(p.requestId),
            r,
          );
          requests.push(r);
        }
        const r = pending.get(
          (c === page ? 'page:' : 'worker:') + String(p?.requestId),
        );
        if (!r) {
          return;
        }
        if (m.method === 'Network.responseReceived') {
          const response = p.response as {
            status: number;
            fromDiskCache?: boolean;
          };
          r.status = response.status;
          r.response = p.timestamp;
          r.diskCache = response.fromDiskCache;
        }
        if (m.method === 'Network.loadingFinished') {
          r.end = p.timestamp;
          r.bytes = p.encodedDataLength;
          if (
            r.status === 200 &&
            !r.diskCache &&
            Number(r.bytes) > 0 &&
            /terminal\.[^/]+\/v1\/perpetuals$/u.test(String(r.url))
          ) {
            page
              .evaluate('window.__perpsMeasure.backendReady=true')
              .catch(() => undefined);
          }
        }
        if (m.method === 'Network.loadingFailed') {
          r.failure = p.errorText;
        }
      });
      await c.call('Network.enable');
      await c.call('Network.setCacheDisabled', { cacheDisabled: true });
    }
    const quote = (value: string) => `'${value.replaceAll("'", "'\"'\"'")}'`;
    const helper = `${quote(process.execPath)} ${quote(fileURLToPath(import.meta.url))}`;
    const nodes: Record<string, unknown> = {
      enter: {
        action: 'ui.press',
        [NODE_FIELDS.testId]: 'bottom-nav-perps',
        intent: 'Enter Perps for the first time in the document lifecycle',
        next: 'assert',
      },
      assert: {
        action: 'command',
        cmd: `${helper} assert`,
        intent:
          'Verify populated market prices and initialized account snapshots after navigation',
        [NODE_FIELDS.timeoutMs]: 45000,
        next: 'screenshot',
      },
      screenshot: {
        action: 'ui.screenshot',
        path: 'screenshots/live-markets.png',
        intent:
          'Record the rendered market list after live readiness assertions',
        next: 'done',
      },
      done: { action: 'end', status: 'pass' },
    };
    if (cold) {
      nodes.unlock = {
        action: 'metamask.wallet.ensure_unlocked',
        intent: 'Unlock the locked wallet in the new browser process',
        next: 'delay',
      };
      nodes.delay = {
        action: 'command',
        cmd: `${helper} delay ${mode}`,
        intent: 'Wait for the declared unlock-to-entry interval',
        next: 'enter',
      };
    }
    if (mode === 'account') {
      nodes.switch = {
        action: 'ui.press',
        [NODE_FIELDS.testId]: `multichain-account-cell-name-${accountName}`,
        intent: 'Select the existing target account through its visible row',
        next: 'home',
      };
      nodes.home = {
        action: 'ui.wait_for',
        [NODE_FIELDS.testId]: 'bottom-nav-perps',
        [NODE_FIELDS.timeoutMs]: 10000,
        intent: 'Confirm the selected wallet can open its Perps dashboard',
        next: 'enter',
      };
    }
    if (mode === 'background_resume') {
      nodes.resume = {
        action: 'command',
        cmd: `${helper} resume`,
        intent:
          'Hide and restore the current page through one task-owned temporary tab',
        next: 'enter',
      };
    }
    let entry = 'enter';
    if (cold) {
      entry = 'unlock';
    } else if (mode === 'background_resume') {
      entry = 'resume';
    } else if (mode === 'account') {
      entry = 'switch';
    }
    const recipe = {
      $schema: 'https://farmslot.io/schemas/recipe-v1.schema.json',
      title: `Perps ${arm} ${mode} sample ${index}`,
      workflow: {
        entry,
        nodes,
      },
    };
    const recipePath = path.join(out, 'recipe.json');
    writeFileSync(recipePath, JSON.stringify(recipe, null, 2));
    await run(
      harness,
      [
        'run',
        recipePath,
        '--adapter',
        'extension',
        '--target',
        repo,
        '--plan',
        '--json',
      ],
      path.join(out, 'plan.json'),
    );
    await run(
      harness,
      [
        'run',
        recipePath,
        '--adapter',
        'extension',
        '--target',
        repo,
        '--cdp-port',
        String(port),
        '--artifacts-dir',
        path.join(out, 'recipe-run'),
        '--json',
      ],
      path.join(out, 'recipe.log'),
    );
    let result: Record<string, unknown> = {};
    for (let i = 0; i < 300; i++) {
      result = (await page.evaluate('window.__perpsMeasure')) as Record<
        string,
        unknown
      >;
      if (result.ready !== null) {
        break;
      }
      await delay(100);
    }
    const numbers = result as Record<string, number | null>;
    const metrics = {
      entryToRowsMs:
        numbers.firstRows !== null && numbers.entry !== null
          ? Number(numbers.firstRows) - Number(numbers.entry)
          : null,
      observedUnlockToEntryMs:
        numbers.unlocked !== null && numbers.entry !== null
          ? Number(numbers.entry) - Number(numbers.unlocked)
          : null,
      entryToLiveMs:
        numbers.ready !== null && numbers.entry !== null
          ? Number(numbers.ready) - Number(numbers.entry)
          : null,
      unlockClickToLiveMs:
        numbers.unlock !== null && numbers.ready !== null
          ? Number(numbers.ready) - Number(numbers.unlock)
          : null,
      unlockClickToDataMs:
        numbers.unlock !== null && numbers.dataReady !== null
          ? Number(numbers.dataReady) - Number(numbers.unlock)
          : null,
      unlockClickToEntryMs:
        numbers.unlock !== null && numbers.entry !== null
          ? Number(numbers.entry) - Number(numbers.unlock)
          : null,
    };
    const build = verifyBuild(arm);
    assert.equal(
      await browserPid(port),
      afterPid,
      'Browser changed during measurement',
    );
    const finalWorkers = (await targets())
      .filter(
        (target) =>
          target.type === 'service_worker' && target.url.includes(extensionId),
      )
      .map((target) => target.id)
      .sort();
    assert.deepEqual(
      finalWorkers,
      initialWorkers,
      'Worker changed during measurement',
    );
    if (mode === 'background_resume') {
      const visibility = result.visibility as { state: string; at: number }[];
      const hidden = visibility.findIndex((event) => event.state === 'hidden');
      assert(
        hidden >= 0 &&
          visibility
            .slice(hidden + 1)
            .some((event) => event.state === 'visible'),
        'Missing hidden-to-visible transition',
      );
    }
    assert.equal(
      (await targets()).filter(
        (t) => t.type === 'page' && t.url.includes(`${extensionId}/home.html`),
      ).length,
      1,
      'Open page count changed during sample',
    );
    const { formatPerpsFiat, PRICE_RANGES_UNIVERSAL } = await import(
      path.join(repo, 'shared/lib/perps-formatters.ts')
    );
    const rowProof = (result.rowProof ?? []) as {
      symbol: string;
      displayed: string;
      quote: { price: string };
      metadataLive?: boolean;
      pricesLive?: boolean;
    }[];
    const accuracy = rowProof.map((row) => ({
      ...row,
      expected: formatPerpsFiat(Number(row.quote?.price), {
        ranges: PRICE_RANGES_UNIVERSAL,
      }),
      matched:
        row.displayed ===
        formatPerpsFiat(Number(row.quote?.price), {
          ranges: PRICE_RANGES_UNIVERSAL,
        }),
    }));
    const collectorSources = [
      'measure-loading.ts',
      'market-observation.ts',
      'browser-process.ts',
      'run-loading-cohort.ts',
    ].map((file) => ({
      file,
      sha256: createHash('sha256')
        .update(readFileSync(new URL(file, import.meta.url)))
        .digest('hex'),
    }));
    const record = {
      collectorVersion: 3,
      collectorSources,
      formatterSha256: createHash('sha256')
        .update(readFileSync(path.join(repo, 'shared/lib/perps-formatters.ts')))
        .digest('hex'),
      collectorSha256: createHash('sha256')
        .update(JSON.stringify(collectorSources))
        .digest('hex'),
      accountName: mode === 'account' ? accountName : undefined,
      accuracy,
      arm,
      mode,
      index,
      beforePid,
      afterPid,
      initialWorkers,
      finalWorkers,
      build,
      checkoutHead: execFileSync('git', ['rev-parse', 'HEAD'], {
        encoding: 'utf8',
      }).trim(),
      metrics,
      observation: result,
      requests,
    };
    writeFileSync(
      path.join(out, 'measurements.json'),
      JSON.stringify(record, null, 2),
    );
    assert(
      result.ready !== null,
      'Live-ready boundary timed out; retain invalid sample',
    );
    assert(
      accuracy.length > 0 && accuracy.every((row) => row.matched),
      'Displayed prices do not match stream quotes at the measured boundary',
    );
    assert.equal(
      String(result.managerAddress).toLowerCase(),
      String(result.selectedAddress).toLowerCase(),
      'Manager belongs to another account',
    );
    if (cold) {
      assert(
        requests.some(
          (r) =>
            r.status === 200 &&
            r.diskCache === false &&
            Number(r.bytes) > 0 &&
            /terminal\.[^/]+\/v1\/perpetuals$/u.test(String(r.url)),
        ),
        'A fresh non-disk-cache Terminal metadata response is required',
      );
    }
    console.log(
      JSON.stringify({
        arm,
        mode,
        index,
        ...metrics,
        requests: requests.length,
      }),
    );
  } catch (error) {
    writeFileSync(
      path.join(out, 'failure.json'),
      JSON.stringify(
        {
          error: String(error),
          observation: await page
            .evaluate('window.__perpsMeasure')
            .catch(() => null),
          requests,
        },
        null,
        2,
      ),
    );
    throw error;
  } finally {
    await page
      .evaluate(
        'if(window.__perpsMeasure){window.__perpsMeasure.stop=true;window.__perpsMeasure.removeSdk?.forEach(f=>f());window.__perpsMeasure.removeSdk=[];document.removeEventListener("visibilitychange",window.__perpsMeasure.onVisibility);document.removeEventListener("click",window.__perpsMeasure.onClick,true);}',
      )
      .catch(() => undefined);
    for (const c of connections) {
      await c
        .call('Network.setCacheDisabled', { cacheDisabled: false })
        .catch(() => undefined);
      c.socket.close();
    }
  }
}
if (process.argv[2] === 'resume') {
  const target = await pageTarget();
  const cdp = await connect(target);
  let temporary: string | undefined;
  try {
    temporary = (await cdp.call('Target.createTarget', { url: 'about:blank' }))
      .targetId as string;
    await cdp.call('Target.activateTarget', { targetId: temporary });
    for (
      let i = 0;
      i < 50 && (await cdp.evaluate('document.visibilityState')) !== 'hidden';
      i++
    ) {
      await delay(100);
    }
    assert.equal(await cdp.evaluate('document.visibilityState'), 'hidden');
    await cdp.call('Target.activateTarget', { targetId: target.id });
    for (
      let i = 0;
      i < 50 && (await cdp.evaluate('document.visibilityState')) !== 'visible';
      i++
    ) {
      await delay(100);
    }
    assert.equal(await cdp.evaluate('document.visibilityState'), 'visible');
  } finally {
    if (temporary) {
      await cdp.call('Target.closeTarget', { targetId: temporary });
    }
    cdp.socket.close();
  }
} else if (process.argv[2] === 'delay') {
  const page = await connect(await pageTarget());
  try {
    await waitForHomeControl();
    if (process.argv[3] === 'delayed') {
      const remaining = (await page.evaluate(
        'Math.max(0,3000-(performance.now()-window.__perpsMeasure.unlocked))',
      )) as number;
      await delay(remaining);
    }
  } finally {
    page.socket.close();
  }
} else if (process.argv[2] === 'assert') {
  const page = await connect(await pageTarget());
  try {
    let ready = false;
    for (let i = 0; i < 300; i++) {
      if (
        await page.evaluate(
          'window.__perpsMeasure?.ready != null && window.__perpsMeasure.rowProof?.length>0 && window.__perpsMeasure.requiredSpans.every(name=>window.__perpsMeasure.spans.some(span=>span.phase==="spanEnd" && span.name===name && span.data?.success===true))',
        )
      ) {
        ready = true;
        break;
      }
      await delay(100);
    }
    assert(ready, 'Live backend rows did not become ready');
  } finally {
    page.socket.close();
  }
} else {
  assert(
    ['before', 'after'].includes(process.argv[2]),
    'Specify before or after',
  );
  assert(
    ['immediate', 'delayed', 'warm', 'background_resume', 'account'].includes(
      process.argv[3],
    ),
    'Specify a supported flow',
  );
  assert(
    /^[1-9][0-9]*$/u.test(process.argv[4]),
    'Specify a positive sample index',
  );
  const accountName = process.argv[5];
  assert(
    process.argv[3] !== 'account' ||
      (accountName && Object.hasOwn(config.accounts ?? {}, accountName)),
    'Account flow requires an existing label in config.accounts',
  );
  await sample(process.argv[2], process.argv[3], process.argv[4], accountName);
}
