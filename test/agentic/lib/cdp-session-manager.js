'use strict';

/**
 * CdpSessionManager — implements ISessionManager by attaching to an
 * already-running Chrome via chromium.connectOverCDP().
 *
 * Usage:
 *   const mgr = await CdpSessionManager.connect(6668);
 */

const { promises: fs, createWriteStream } = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const {
  resolveExtensionId,
  generateSessionId,
  ErrorCodes,
} = require('@metamask/client-mcp-core');
const { getExtensionState: readExtensionState } = require('./state-inspector');

class CdpSessionManager {
  #browser;
  #cdpContext;
  #activePage;
  #extensionId;
  #sessionId;
  #startedAt;
  #refMap = new Map();
  #screenshotDir;
  #pageCdpSessions = new WeakMap();
  #pageFetchInterceptors = new WeakMap();
  #backgroundCdpClients = new Map();
  #homeCdpClients = new Map();
  #cdpPort;
  #activeTraces = new Map();
  #cdpProbes = new Map();
  #cdpProbeResults = new Map();

  constructor(browser, cdpContext, activePage, extensionId, cdpPort) {
    this.#browser = browser;
    this.#cdpContext = cdpContext;
    this.#activePage = activePage;
    this.#extensionId = extensionId;
    this.#cdpPort = cdpPort;
    this.#sessionId = generateSessionId();
    this.#startedAt = new Date().toISOString();
    this.#screenshotDir = path.join(process.cwd(), 'test-artifacts', 'screenshots');
  }

  setArtifactsDir(artifactsDir) {
    if (!artifactsDir) return;
    this.#screenshotDir = path.join(artifactsDir, 'screenshots');
  }

  static async connect(cdpPort) {
    const browser = await chromium.connectOverCDP(`http://localhost:${cdpPort}`);

    const contexts = browser.contexts();
    const cdpContext = contexts[0];
    if (!cdpContext) throw new Error(`CDP: no browser context found on port ${cdpPort}`);

    const log = {
      info: (message) => process.stdout.write(`[cdp] ${message}\n`),
      warn: (message, error) => process.stderr.write(`[cdp] WARN: ${message} ${error || ''}\n`),
    };

    const extensionId = await resolveExtensionId({ context: cdpContext, log });
    if (!extensionId) throw new Error('CDP: Could not resolve MetaMask extension ID');

    const homeUrl = `chrome-extension://${extensionId}/home.html`;

    let activePage = cdpContext.pages().find((p) => p.url().startsWith(`chrome-extension://${extensionId}`));

    if (!activePage) {
      const candidate =
        cdpContext.pages().find((p) => !p.isClosed() && !p.url().startsWith('chrome://')) ||
        (await cdpContext.newPage());

      const cdpSession = await cdpContext.newCDPSession(candidate);
      await cdpSession.send('Page.navigate', { url: homeUrl });
      await candidate.waitForLoadState('domcontentloaded').catch(() => {});
      activePage = candidate;
    }

    // Disable Playwright's default media emulation so we don't override the
    // real OS `prefers-color-scheme` (flips MetaMask theme when theme=System).
    await activePage
      .emulateMedia({ colorScheme: null, reducedMotion: null, forcedColors: null })
      .catch(() => {});

    return new CdpSessionManager(browser, cdpContext, activePage, extensionId, cdpPort);
  }

  // ── Session lifecycle ──────────────────────────────────────────────

  hasActiveSession() { return true; }

  getSessionId() { return this.#sessionId; }

  getSessionState() {
    return {
      sessionId: this.#sessionId,
      extensionId: this.#extensionId,
      startedAt: this.#startedAt,
      ports: { anvil: 0, fixtureServer: 0 },
      stateMode: 'default',
    };
  }

  getSessionMetadata() { return undefined; }

  async launch(_input) {
    throw new Error('CDP mode: already connected to existing browser — launch() is not supported');
  }

  async cleanup() {
    await this.#browser.close();
    return true;
  }

  // ── Page management ────────────────────────────────────────────────

  getPage() { return this.#activePage; }

  setActivePage(page) {
    this.#activePage = page;
    this.clearRefMap();
  }

  getTrackedPages() {
    return this.#cdpContext.pages()
      .filter((p) => !p.isClosed())
      .map((p) => ({
        role: this.classifyPageRole(p, this.#extensionId),
        url: p.url(),
        page: p,
      }));
  }

  classifyPageRole(page, extensionId) {
    const url = page.url();
    const id = extensionId || this.#extensionId;
    const extPrefix = `chrome-extension://${id}`;

    if (url.startsWith(extPrefix)) {
      if (url.includes('notification.html') || url.includes('sidepanel.html')) return 'notification';
      return 'extension';
    }
    if (url.startsWith('http')) return 'dapp';
    return 'other';
  }

  getContext() { return this.#cdpContext; }

  async #httpGetJson(url) {
    return new Promise((resolve, reject) => {
      http
        .get(url, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk.toString();
          });
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(error);
            }
          });
        })
        .on('error', reject);
    });
  }

  async #getOrCreatePageCdpSession(page) {
    if (!page || page.isClosed()) {
      throw new Error('CDP: cannot create a CDP session for a closed page');
    }

    const cached = this.#pageCdpSessions.get(page);
    if (cached) {
      return cached;
    }

    const session = await this.#cdpContext.newCDPSession(page);
    this.#pageCdpSessions.set(page, session);
    return session;
  }

  #resolvePagesForTarget(target = 'active') {
    const tracked = this.getTrackedPages();
    switch (target) {
      case 'active':
        return this.#activePage && !this.#activePage.isClosed() ? [this.#activePage] : [];
      case 'extension':
        return tracked.filter((entry) => entry.role === 'extension').map((entry) => entry.page);
      case 'notification':
        return tracked.filter((entry) => entry.role === 'notification').map((entry) => entry.page);
      case 'dapp':
        return tracked.filter((entry) => entry.role === 'dapp').map((entry) => entry.page);
      case 'all-pages':
        return tracked.map((entry) => entry.page);
      case 'all-extension':
        return tracked
          .filter((entry) => entry.role === 'extension' || entry.role === 'notification')
          .map((entry) => entry.page);
      default:
        throw new Error(`CDP: unsupported browser-control target "${target}"`);
    }
  }

  async #getOrCreateBackgroundCdpClients() {
    const targets = await this.#httpGetJson(`http://127.0.0.1:${this.#cdpPort}/json/list`);
    const workers = targets.filter(
      (target) =>
        target.type === 'service_worker' &&
        typeof target.url === 'string' &&
        target.url.startsWith(`chrome-extension://${this.#extensionId}/`) &&
        typeof target.webSocketDebuggerUrl === 'string',
    );

    if (workers.length === 0) {
      throw new Error('CDP: no extension service worker targets found for network control');
    }

    const clients = [];
    for (const worker of workers) {
      let client = this.#backgroundCdpClients.get(worker.webSocketDebuggerUrl);
      if (!client) {
        client = new RawCdpClient(worker.webSocketDebuggerUrl);
        this.#backgroundCdpClients.set(worker.webSocketDebuggerUrl, client);
      }
      clients.push({
        client,
        role: 'background',
        url: worker.url,
      });
    }

    return clients;
  }

  #buildNetworkProfile(options = {}) {
    const profile = String(options.throttling || options.profile || 'reset');
    const connectionType = options.connectionType || options.connection_type;

    if (profile === 'offline') {
      return {
        profile,
        params: {
          offline: true,
          latency: 0,
          downloadThroughput: 0,
          uploadThroughput: 0,
          ...(connectionType ? { connectionType } : {}),
        },
      };
    }

    if (profile === 'degraded') {
      const latencyMs = Number(options.latencyMs ?? options.latency_ms ?? 1500);
      const downloadKbps = Number(options.downloadKbps ?? options.download_kbps ?? 128);
      const uploadKbps = Number(options.uploadKbps ?? options.upload_kbps ?? 64);
      return {
        profile,
        params: {
          offline: false,
          latency: latencyMs,
          downloadThroughput: Math.round((downloadKbps * 1024) / 8),
          uploadThroughput: Math.round((uploadKbps * 1024) / 8),
          ...(connectionType ? { connectionType } : {}),
        },
      };
    }

    if (profile === 'slow') {
      return {
        profile,
        params: {
          offline: false,
          latency: 750,
          downloadThroughput: Math.round((512 * 1024) / 8),
          uploadThroughput: Math.round((256 * 1024) / 8),
          ...(connectionType ? { connectionType } : {}),
        },
      };
    }

    if (profile === 'custom') {
      const latencyMs = Number(options.latencyMs ?? options.latency_ms ?? 0);
      const downloadKbps = Number(options.downloadKbps ?? options.download_kbps ?? 0);
      const uploadKbps = Number(options.uploadKbps ?? options.upload_kbps ?? 0);
      return {
        profile,
        params: {
          offline: false,
          latency: latencyMs,
          downloadThroughput: Math.max(0, Math.round((downloadKbps * 1024) / 8)),
          uploadThroughput: Math.max(0, Math.round((uploadKbps * 1024) / 8)),
          ...(connectionType ? { connectionType } : {}),
        },
      };
    }

    if (profile === 'reset') {
      return {
        profile,
        params: {
          offline: false,
          latency: 0,
          downloadThroughput: -1,
          uploadThroughput: -1,
          ...(connectionType ? { connectionType } : {}),
        },
      };
    }

    throw new Error(`CDP: unsupported network profile "${profile}"`);
  }

  async applyNetworkProfile(options = {}) {
    const { profile, params } = this.#buildNetworkProfile(options);
    const applied = [];
    const target = String(options.target || 'active');

    if (target === 'background') {
      const clients = await this.#getOrCreateBackgroundCdpClients();
      for (const { client, role, url } of clients) {
        await client.send('Network.enable');
        await client.send('Network.emulateNetworkConditions', params);
        await client.send('Network.setCacheDisabled', { cacheDisabled: profile !== 'reset' });
        applied.push({ role, url });
      }
    } else if (target === 'all-extension') {
      const pages = this.#resolvePagesForTarget(target);
      const clients = await this.#getOrCreateBackgroundCdpClients();
      if (pages.length === 0) {
        throw new Error(`CDP: no extension pages available for browser-control target "${target}"`);
      }
      for (const page of pages) {
        const session = await this.#getOrCreatePageCdpSession(page);
        await session.send('Network.enable');
        await session.send('Network.emulateNetworkConditions', params);
        await session.send('Network.setCacheDisabled', { cacheDisabled: profile !== 'reset' });
        applied.push({
          role: this.classifyPageRole(page),
          url: page.url(),
        });
      }
      for (const { client, role, url } of clients) {
        await client.send('Network.enable');
        await client.send('Network.emulateNetworkConditions', params);
        await client.send('Network.setCacheDisabled', { cacheDisabled: profile !== 'reset' });
        applied.push({ role, url });
      }
    } else {
      const pages = this.#resolvePagesForTarget(target);
      if (pages.length === 0) {
        throw new Error(`CDP: no pages available for browser-control target "${target}"`);
      }
      for (const page of pages) {
        const session = await this.#getOrCreatePageCdpSession(page);
        await session.send('Network.enable');
        await session.send('Network.emulateNetworkConditions', params);
        await session.send('Network.setCacheDisabled', { cacheDisabled: profile !== 'reset' });
        applied.push({
          role: this.classifyPageRole(page),
          url: page.url(),
        });
      }
    }

    return {
      control: 'network',
      profile,
      target,
      applied,
      params,
    };
  }

  async applyEmulationProfile(options = {}) {
    const emulation = String(options.emulation || 'reset');
    const target = String(options.target || 'active');
    const pages = this.#resolvePagesForTarget(target === 'all-extension' ? 'all-extension' : target);
    if (pages.length === 0) {
      throw new Error(`CDP: no pages available for emulation target "${target}"`);
    }

    const applied = [];
    for (const page of pages) {
      const session = await this.#getOrCreatePageCdpSession(page);

      if (emulation === 'cpu') {
        const rate = Number(options.rate);
        if (!Number.isFinite(rate) || rate < 1) {
          throw new Error('CDP: cpu emulation requires rate >= 1');
        }
        await session.send('Emulation.setCPUThrottlingRate', { rate });
        applied.push({
          role: this.classifyPageRole(page),
          url: page.url(),
          rate,
        });
        continue;
      }

      if (emulation === 'media') {
        const features = [];
        if (options.colorScheme || options.color_scheme) {
          features.push({
            name: 'prefers-color-scheme',
            value: String(options.colorScheme || options.color_scheme),
          });
        }
        if (options.reducedMotion || options.reduced_motion) {
          features.push({
            name: 'prefers-reduced-motion',
            value: String(options.reducedMotion || options.reduced_motion),
          });
        }
        if (features.length === 0) {
          throw new Error('CDP: media emulation requires color_scheme and/or reduced_motion');
        }
        await session.send('Emulation.setEmulatedMedia', { features });
        applied.push({
          role: this.classifyPageRole(page),
          url: page.url(),
          features,
        });
        continue;
      }

      if (emulation === 'timezone') {
        const timezoneId = String(options.timezoneId || options.timezone_id || '').trim();
        if (!timezoneId) {
          throw new Error('CDP: timezone emulation requires timezone_id');
        }
        await session.send('Emulation.setTimezoneOverride', { timezoneId });
        applied.push({
          role: this.classifyPageRole(page),
          url: page.url(),
          timezoneId,
        });
        continue;
      }

      if (emulation === 'reset') {
        await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
        await session.send('Emulation.setEmulatedMedia', { features: [] });
        applied.push({
          role: this.classifyPageRole(page),
          url: page.url(),
          rate: 1,
        });
        continue;
      }

      throw new Error(`CDP: unsupported emulation profile "${emulation}"`);
    }

    return {
      control: 'emulation',
      emulation,
      target,
      applied,
    };
  }

  async applyStorageAction(options = {}) {
    const storage = String(options.storage || '');
    if (!['clear_origin', 'clear_web_storage'].includes(storage)) {
      throw new Error(`CDP: unsupported storage action "${storage}"`);
    }

    const target = String(options.target || 'active');
    const rawOrigin = String(options.origin || this.#activePage?.url() || '').trim();
    const origin = rawOrigin ? new URL(rawOrigin).origin : '';
    if (!origin) {
      throw new Error('CDP: storage clear_origin requires an origin');
    }

    const pages = this.#resolvePagesForTarget(target === 'all-extension' ? 'all-extension' : target);
    if (pages.length === 0) {
      throw new Error(`CDP: no pages available for storage target "${target}"`);
    }

    const storageTypes = String(options.storageTypes || options.storage_types || 'all');
    const applied = [];
    for (const page of pages) {
      const session = await this.#getOrCreatePageCdpSession(page);
      if (storage === 'clear_origin') {
        await session.send('Storage.clearDataForOrigin', {
          origin,
          storageTypes,
        });
      } else {
        await session.send('DOMStorage.enable');
        await session.send('DOMStorage.clear', {
          storageId: {
            securityOrigin: origin,
            isLocalStorage: true,
          },
        });
        await session.send('DOMStorage.clear', {
          storageId: {
            securityOrigin: origin,
            isLocalStorage: false,
          },
        });
      }
      applied.push({
        role: this.classifyPageRole(page),
        url: page.url(),
      });
    }

    return {
      control: 'storage',
      storage,
      origin,
      storageTypes,
      target,
      applied,
    };
  }

  async applyServiceWorkerAction(options = {}) {
    const worker = String(options.worker || '');
    if (!['inspect', 'eval'].includes(worker)) {
      throw new Error(`CDP: unsupported service worker action "${worker}"`);
    }

    const browserSession = await this.#getOrCreatePageCdpSession(this.#activePage);
    await browserSession.send('ServiceWorker.enable');

    const targets = await this.#httpGetJson(`http://127.0.0.1:${this.#cdpPort}/json/list`);
    const workers = targets.filter(
      (target) =>
        target.type === 'service_worker' &&
        typeof target.url === 'string' &&
        target.url.startsWith(`chrome-extension://${this.#extensionId}/`),
    );

    if (worker === 'eval') {
      const expression = String(options.expression || '').trim();
      if (!expression) {
        throw new Error('CDP: service worker eval requires an expression');
      }

      const clients = await this.#getOrCreateBackgroundCdpClients();
      const targetClient = clients[0];
      const result = await targetClient.client.send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });

      return {
        control: 'service_worker',
        worker,
        url: targetClient.url,
        result: result.result?.value,
      };
    }

    return {
      control: 'service_worker',
      worker,
      count: workers.length,
      workers: workers.map((target) => ({
        url: target.url,
        title: target.title,
      })),
    };
  }

  async applyTargetAction(options = {}) {
    const targetAction = String(options.targetAction || options.target_action || '');
    if (!['inspect', 'switch_role'].includes(targetAction)) {
      throw new Error(`CDP: unsupported target action "${targetAction}"`);
    }

    if (targetAction === 'switch_role') {
      const role = String(options.role || '').trim();
      const match = this.getTrackedPages().find((entry) => entry.role === role);
      if (!match) {
        throw new Error(`CDP: no tracked page found for target role "${role}"`);
      }
      await match.page.bringToFront();
      this.setActivePage(match.page);
      return {
        control: 'target',
        targetAction,
        role,
        active: {
          role: match.role,
          url: match.url,
        },
      };
    }

    const pages = this.getTrackedPages().map((entry) => ({
      role: entry.role,
      url: entry.url,
    }));

    const targets = await this.#httpGetJson(`http://127.0.0.1:${this.#cdpPort}/json/list`);
    const extensionWorkers = targets
      .filter(
        (target) =>
          target.type === 'service_worker' &&
          typeof target.url === 'string' &&
          target.url.startsWith(`chrome-extension://${this.#extensionId}/`),
      )
      .map((target) => ({
        role: 'background',
        type: target.type,
        url: target.url,
        title: target.title,
      }));

    const roleCounts = [...pages, ...extensionWorkers].reduce((acc, target) => {
      const role = target.role || 'other';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    return {
      control: 'target',
      targetAction,
      extensionId: this.#extensionId,
      pageCount: pages.length,
      workerCount: extensionWorkers.length,
      roleCounts,
      targets: [...pages, ...extensionWorkers],
    };
  }

  async applyPageAction(options = {}) {
    const pageAction = String(options.pageAction || options.page_action || '');
    if (pageAction !== 'reload') {
      throw new Error(`CDP: unsupported page action "${pageAction}"`);
    }

    const target = String(options.target || 'active');
    const pages = this.#resolvePagesForTarget(target === 'all-extension' ? 'all-extension' : target);
    if (pages.length === 0) {
      throw new Error(`CDP: no pages available for page action target "${target}"`);
    }

    const applied = [];
    for (const page of pages) {
      const session = await this.#getOrCreatePageCdpSession(page);
      await session.send('Page.reload', { ignoreCache: true });
      applied.push({
        role: this.classifyPageRole(page),
        url: page.url(),
      });
    }

    return {
      control: 'page',
      pageAction,
      target,
      applied,
    };
  }

  async applyBrowserAction(options = {}) {
    const browserAction = String(options.browserAction || options.browser_action || '');
    if (!['grant_permission', 'reset_permissions'].includes(browserAction)) {
      throw new Error(`CDP: unsupported browser action "${browserAction}"`);
    }

    const session = await this.#getOrCreatePageCdpSession(this.#activePage);

    if (browserAction === 'grant_permission') {
      const permission = String(options.permission || '').trim();
      const origin = String(options.origin || '').trim();
      if (!permission || !origin) {
        throw new Error('CDP: grant_permission requires permission and origin');
      }

      await session.send('Browser.grantPermissions', {
        origin,
        permissions: [permission],
      });
      return {
        control: 'browser',
        browserAction,
        permission,
        origin,
      };
    }

    await session.send('Browser.resetPermissions', {});
    return {
      control: 'browser',
      browserAction,
    };
  }

  async applyFetchAction(options = {}) {
    const fetchAction = String(options.fetchAction || options.fetch_action || '');
    if (!['fail_requests', 'reset'].includes(fetchAction)) {
      throw new Error(`CDP: unsupported fetch action "${fetchAction}"`);
    }

    const target = String(options.target || 'active');
    const pages = this.#resolvePagesForTarget(target === 'all-extension' ? 'all-extension' : target);
    if (pages.length === 0) {
      throw new Error(`CDP: no pages available for fetch target "${target}"`);
    }

    const applied = [];
    for (const page of pages) {
      const session = await this.#getOrCreatePageCdpSession(page);
      let interceptor = this.#pageFetchInterceptors.get(page);
      if (!interceptor) {
        interceptor = {
          rules: [],
          handler: async (event) => {
            const match = interceptor.rules.find((rule) => event.request?.url?.includes(rule.pattern));
            if (match) {
              await session.send('Fetch.failRequest', {
                requestId: event.requestId,
                errorReason: match.errorReason,
              });
              return;
            }
            await session.send('Fetch.continueRequest', { requestId: event.requestId });
          },
        };
        session.on('Fetch.requestPaused', interceptor.handler);
        this.#pageFetchInterceptors.set(page, interceptor);
      }

      if (fetchAction === 'fail_requests') {
        const urlPattern = String(options.urlPattern || options.url_pattern || '').trim();
        if (!urlPattern) {
          throw new Error('CDP: fail_requests requires url_pattern');
        }
        const errorReason = String(options.errorReason || options.error_reason || 'Failed');
        interceptor.rules = [{ pattern: urlPattern, errorReason }];
        await session.send('Fetch.enable', {
          patterns: [{ urlPattern: '*', requestStage: 'Request' }],
        });
        applied.push({
          role: this.classifyPageRole(page),
          url: page.url(),
          urlPattern,
          errorReason,
        });
        continue;
      }

      interceptor.rules = [];
      await session.send('Fetch.disable');
      applied.push({
        role: this.classifyPageRole(page),
        url: page.url(),
      });
    }

    return {
      control: 'fetch',
      fetchAction,
      target,
      applied,
    };
  }

  async applyPerformanceAction(options = {}) {
    const performanceAction = String(options.performanceAction || options.performance_action || '');
    if (performanceAction !== 'metrics') {
      throw new Error(`CDP: unsupported performance action "${performanceAction}"`);
    }

    const target = String(options.target || 'active');
    const pages = this.#resolvePagesForTarget(target === 'all-extension' ? 'all-extension' : target);
    if (pages.length === 0) {
      throw new Error(`CDP: no pages available for performance target "${target}"`);
    }

    const applied = [];
    for (const page of pages) {
      const session = await this.#getOrCreatePageCdpSession(page);
      await session.send('Performance.enable');
      const result = await session.send('Performance.getMetrics');
      const metrics = {};
      for (const entry of result.metrics || []) {
        metrics[entry.name] = entry.value;
      }
      applied.push({
        role: this.classifyPageRole(page),
        url: page.url(),
        metrics,
      });
    }

    return {
      control: 'performance',
      performanceAction,
      target,
      applied,
    };
  }

  async startTraceCapture(options = {}) {
    const label = String(options.label || '').trim();
    if (!label) {
      throw new Error('CDP: trace_start requires a label');
    }
    if (this.#activeTraces.has(label)) {
      throw new Error(`CDP: trace "${label}" is already active`);
    }

    const target = String(options.target || 'active');
    if (target === 'background') {
      throw new Error('CDP: trace_start does not support background targets in v1');
    }

    const categories = Array.isArray(options.categories) && options.categories.length > 0
      ? options.categories
      : [
          'devtools.timeline',
          'disabled-by-default-devtools.timeline',
          'disabled-by-default-v8.cpu_profiler',
        ];

    const pages = this.#resolvePagesForTarget(target);
    if (pages.length === 0) {
      throw new Error(`CDP: no pages available for trace target "${target}"`);
    }

    const traces = [];
    for (const page of pages) {
      const session = await this.#getOrCreatePageCdpSession(page);
      const state = {
        session,
        page,
        events: [],
        onDataCollected: (event) => {
          if (Array.isArray(event.value)) {
            state.events.push(...event.value);
          }
        },
        onTracingComplete: null,
      };
      state.onTracingComplete = new Promise((resolve) => {
        state.onTracingCompleteHandler = resolve;
      });
      state.handleTracingComplete = () => state.onTracingCompleteHandler();

      session.on('Tracing.dataCollected', state.onDataCollected);
      session.on('Tracing.tracingComplete', state.handleTracingComplete);
      await session.send('Tracing.start', {
        categories: categories.join(','),
        options: 'sampling-frequency=10000',
        transferMode: 'ReportEvents',
      });
      traces.push(state);
    }

    this.#activeTraces.set(label, {
      label,
      target,
      categories,
      traces,
      startedAt: new Date().toISOString(),
    });

    return {
      label,
      target,
      categories,
      pages: traces.map((trace) => ({
        role: this.classifyPageRole(trace.page),
        url: trace.page.url(),
      })),
    };
  }

  async stopTraceCapture(options = {}) {
    const label = String(options.label || '').trim();
    const activeTrace = this.#activeTraces.get(label);
    if (!activeTrace) {
      throw new Error(`CDP: trace "${label}" is not active`);
    }

    this.#activeTraces.delete(label);
    const tracesDir = path.join(process.cwd(), 'test-artifacts', 'traces');
    await fs.mkdir(tracesDir, { recursive: true });
    const filename = options.filename || `${label}-${Date.now()}.json`;
    const filePath = path.join(tracesDir, filename);

    const traceEvents = [];
    for (const trace of activeTrace.traces) {
      await trace.session.send('Tracing.end');
      await trace.onTracingComplete;
      trace.session.off('Tracing.dataCollected', trace.onDataCollected);
      trace.session.off('Tracing.tracingComplete', trace.handleTracingComplete);
      traceEvents.push(
        ...trace.events.map((event) => ({
          ...event,
          __recipeTarget: {
            role: this.classifyPageRole(trace.page),
            url: trace.page.url(),
          },
        })),
      );
    }

    const payload = {
      label,
      target: activeTrace.target,
      categories: activeTrace.categories,
      startedAt: activeTrace.startedAt,
      stoppedAt: new Date().toISOString(),
      traceEvents,
    };

    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
    return {
      label,
      target: activeTrace.target,
      categories: activeTrace.categories,
      path: filePath,
      traceEventCount: traceEvents.length,
    };
  }

  async getExtensionState() {
    const state = await readExtensionState(this.#activePage, {
      extensionId: this.#extensionId,
      chainId: 1,
    });
    const unlockedScreens = new Set([
      'home', 'settings', 'send', 'swap', 'bridge',
      'confirm-transaction', 'confirm-signature', 'confirmation', 'connect',
    ]);
    const isUnlocked = state.isUnlocked || unlockedScreens.has(state.currentScreen);
    return { ...state, isUnlocked };
  }

  // ── Navigation ─────────────────────────────────────────────────────

  async navigateToHome() {
    await this.#activePage.goto(`chrome-extension://${this.#extensionId}/home.html`);
    await this.#activePage.waitForLoadState('domcontentloaded');
  }

  async navigateToSettings() {
    await this.#activePage.goto(`chrome-extension://${this.#extensionId}/home.html#settings`);
    await this.#activePage.waitForLoadState('domcontentloaded');
  }

  async navigateToUrl(url) {
    const newPage = await this.#cdpContext.newPage();
    await newPage.goto(url);
    await newPage.waitForLoadState('domcontentloaded');
    this.setActivePage(newPage);
    return newPage;
  }

  async navigateToNotification() {
    const notificationPage = this.#cdpContext.pages().find(
      (p) => p.url().includes('notification.html') || p.url().includes('sidepanel.html'),
    );

    if (notificationPage) {
      await notificationPage.bringToFront();
      await notificationPage.waitForLoadState('domcontentloaded');
      this.setActivePage(notificationPage);
      return notificationPage;
    }

    const newPage = await this.#cdpContext.newPage();
    await newPage.goto(`chrome-extension://${this.#extensionId}/notification.html`);
    await newPage.waitForLoadState('domcontentloaded');
    this.setActivePage(newPage);
    return newPage;
  }

  async waitForNotificationPage(timeoutMs) {
    const pollInterval = 500;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const found = this.#cdpContext.pages().find(
        (p) => p.url().includes('notification.html') || p.url().includes('sidepanel.html'),
      );
      if (found) {
        this.setActivePage(found);
        return found;
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`CDP: notification page did not appear within ${timeoutMs}ms`);
  }

  // ── Screenshot ─────────────────────────────────────────────────────

  async screenshot(options) {
    await fs.mkdir(this.#screenshotDir, { recursive: true });

    const timestamp = `-${Date.now()}`;
    const filename = `${options.name}${timestamp}.png`;
    const filepath = path.join(this.#screenshotDir, filename);

    let screenshotBuffer;

    if (options.selector) {
      const element = this.#activePage.locator(options.selector);
      screenshotBuffer = await element.screenshot({ path: filepath });
    } else {
      screenshotBuffer = await this.#activePage.screenshot({
        path: filepath,
        fullPage: options.fullPage !== false,
      });
    }

    const sharp = await import('sharp').then((m) => m.default);
    const metadata = await sharp(screenshotBuffer).metadata();

    return {
      path: filepath,
      base64: screenshotBuffer.toString('base64'),
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  }

  // ── Capabilities ───────────────────────────────────────────────────

  getBuildCapability() { return undefined; }
  getFixtureCapability() { return undefined; }
  getChainCapability() { return undefined; }
  getContractSeedingCapability() { return undefined; }
  getStateSnapshotCapability() { return undefined; }

  // ── Context / environment ──────────────────────────────────────────

  getEnvironmentMode() { return 'prod'; }

  setContext(_context, _options) {
    throw new Error(`${ErrorCodes.MM_CONTEXT_SWITCH_BLOCKED}: CDP mode — context switching is not supported`);
  }

  getContextInfo() {
    return {
      currentContext: 'prod',
      hasActiveSession: true,
      sessionId: this.#sessionId,
      capabilities: { available: [] },
      canSwitchContext: false,
    };
  }

  // ── A11y ref map ───────────────────────────────────────────────────

  setRefMap(map) { this.#refMap = map; }
  getRefMap() { return this.#refMap; }
  clearRefMap() { this.#refMap.clear(); }
  resolveA11yRef(ref) { return this.#refMap.get(ref); }

  // ── Generic CDP probe ────────────────────────────────────────────────

  async #getProbeAttachments(scope) {
    // Service workers go via RawCdpClient because Playwright's
    // ctx.serviceWorkers() is empty when connecting to a pre-existing
    // Chromium. Pages go via Playwright CDPSession to reuse its WS.
    const attachments = [];

    if (scope !== 'home') {
      try {
        const clients = await this.#getOrCreateBackgroundCdpClients();
        for (const { client, url } of clients) {
          const rawListeners = new Map(); // event -> Set<cb>
          client.onEvent((msg) => {
            const set = rawListeners.get(msg.method);
            if (!set) return;
            for (const cb of set) {
              try { cb(msg.params); } catch {}
            }
          });
          attachments.push({
            source: 'sw',
            url,
            send: (method, params) => client.send(method, params),
            on: (event, cb) => {
              if (!rawListeners.has(event)) rawListeners.set(event, new Set());
              rawListeners.get(event).add(cb);
            },
            off: (event, cb) => {
              const set = rawListeners.get(event);
              if (set) set.delete(cb);
            },
            detach: async () => { /* keep background client alive — shared */ },
          });
        }
      } catch {
        // no sw — skip
      }
    }

    if (scope !== 'sw') {
      const ctx = this.#cdpContext;
      for (const page of ctx.pages()) {
        if (page.isClosed()) continue;
        if (!page.url().startsWith(`chrome-extension://${this.#extensionId}/`)) continue;
        try {
          const session = await ctx.newCDPSession(page);
          attachments.push({
            source: 'home',
            url: page.url(),
            send: (method, params) => session.send(method, params),
            on: (event, cb) => session.on(event, cb),
            off: (event, cb) => session.off(event, cb),
            detach: () => session.detach(),
          });
        } catch {
          // page may have navigated — skip
        }
      }
    }

    return attachments;
  }

  async startCdpProbe(options = {}) {
    const name = String(options.name || 'default');
    if (this.#cdpProbes.has(name)) {
      throw new Error(`CDP: probe "${name}" already running — call stopCdpProbe first`);
    }

    // Omitting a pattern captures everything on that channel.
    const scope = String(options.scope || 'both');
    const urlPattern = options.url_pattern ? new RegExp(String(options.url_pattern), 'i') : null;
    const messagePattern = options.message_pattern ? new RegExp(String(options.message_pattern), 'i') : null;
    const statusMatch = Array.isArray(options.status_match)
      ? options.status_match.map((s) => Number(s)).filter((n) => Number.isFinite(n))
      : [];

    const streamNetworkPath = options.stream_network_path || null;
    const streamMessagesPath = options.stream_messages_path || null;
    const streamNetwork = streamNetworkPath
      ? createWriteStream(streamNetworkPath, { flags: 'w' })
      : null;
    const streamMessages = streamMessagesPath
      ? createWriteStream(streamMessagesPath, { flags: 'w' })
      : null;

    const requests = [];
    const reqMeta = new Map();
    const messages = [];
    const listeners = [];

    const appendRequest = (rec) => {
      requests.push(rec);
      if (streamNetwork) streamNetwork.write(`${JSON.stringify(rec)}\n`);
    };
    const appendMessage = (rec) => {
      messages.push(rec);
      if (streamMessages) streamMessages.write(`${JSON.stringify(rec)}\n`);
    };

    const attachments = await this.#getProbeAttachments(scope);

    const addListener = (attachment, event, handler) => {
      attachment.on(event, handler);
      listeners.push({ attachment, event, handler });
    };

    for (const attachment of attachments) {
      const { source } = attachment;
      try { await attachment.send('Network.enable'); } catch {}
      try { await attachment.send('Runtime.enable'); } catch {}

      addListener(attachment, 'Network.requestWillBeSent', (params) => {
        const url = params?.request?.url || '';
        if (urlPattern && !urlPattern.test(url)) return;
        const rid = `${source}:${params.requestId}`;
        reqMeta.set(rid, {
          ts: Date.now(),
          source,
          url,
          method: params.request.method,
          body: params.request.postData || '',
        });
      });

      addListener(attachment, 'Network.responseReceived', (params) => {
        const rid = `${source}:${params.requestId}`;
        const meta = reqMeta.get(rid);
        if (!meta) return;
        appendRequest({ ...meta, status: params.response?.status ?? null });
        reqMeta.delete(rid);
      });

      addListener(attachment, 'Network.loadingFailed', (params) => {
        const rid = `${source}:${params.requestId}`;
        const meta = reqMeta.get(rid);
        if (!meta) return;
        appendRequest({ ...meta, status: `aborted:${params.errorText || 'unknown'}` });
        reqMeta.delete(rid);
      });

      addListener(attachment, 'Runtime.consoleAPICalled', (params) => {
        const text = (params.args || [])
          .map((a) => (a.value !== undefined ? String(a.value) : a.description || ''))
          .join(' ');
        if (messagePattern && !messagePattern.test(text)) return;
        appendMessage({ source, kind: params.type || 'log', ts: Date.now(), text });
      });

      addListener(attachment, 'Runtime.exceptionThrown', (params) => {
        const desc = params.exceptionDetails?.exception?.description || params.exceptionDetails?.text || '';
        if (messagePattern && !messagePattern.test(desc)) return;
        appendMessage({ source, kind: 'exception', ts: Date.now(), text: desc });
      });
    }

    const swCount = attachments.filter((a) => a.source === 'sw').length;
    const homeCount = attachments.filter((a) => a.source === 'home').length;
    const startedAt = Date.now();

    this.#cdpProbes.set(name, {
      startedAt,
      scope,
      urlPattern: urlPattern ? urlPattern.source : null,
      messagePattern: messagePattern ? messagePattern.source : null,
      statusMatch,
      swCount,
      homeCount,
      requests,
      reqMeta,
      messages,
      listeners,
      attachments,
      streamNetwork,
      streamMessages,
      streamNetworkPath,
      streamMessagesPath,
    });

    return {
      name,
      startedAt,
      scope,
      attached: { sw: swCount, home: homeCount },
      stream: {
        network: streamNetworkPath,
        messages: streamMessagesPath,
      },
    };
  }

  async stopCdpProbe(options = {}) {
    const name = String(options.name || 'default');
    const probe = this.#cdpProbes.get(name);
    if (!probe) {
      // Idempotent: return the last captured summary so teardown can safely
      // run stop after a main-phase stop, or for diagnostics after failure.
      const cached = this.#cdpProbeResults.get(name);
      if (cached) return cached;
      throw new Error(`CDP: probe "${name}" not started`);
    }
    this.#cdpProbes.delete(name);

    for (const { attachment, event, handler } of probe.listeners || []) {
      try { attachment.off(event, handler); } catch {}
    }
    for (const attachment of probe.attachments || []) {
      try { await attachment.detach(); } catch {}
    }
    if (probe.streamNetwork) { try { probe.streamNetwork.end(); } catch {} }
    if (probe.streamMessages) { try { probe.streamMessages.end(); } catch {} }

    const { requests, messages, statusMatch } = probe;

    const bySource = { sw: 0, home: 0 };
    const byStatus = {};
    let matchedStatus = 0;
    for (const r of requests) {
      bySource[r.source] = (bySource[r.source] || 0) + 1;
      const key = String(r.status);
      byStatus[key] = (byStatus[key] || 0) + 1;
      if (statusMatch.length && statusMatch.includes(r.status)) matchedStatus += 1;
    }

    const msgBySource = { sw: 0, home: 0 };
    for (const e of messages) {
      msgBySource[e.source] = (msgBySource[e.source] || 0) + 1;
    }

    const trimmedRequestSamples = requests.slice(0, 50).map((r) => ({
      ts: r.ts,
      source: r.source,
      status: r.status,
      method: r.method,
      url: r.url,
    }));
    const trimmedMessageSamples = messages.slice(0, 50).map((m) => ({
      ...m,
      text: String(m.text || '').slice(0, 400),
    }));

    const summary = {
      name,
      startedAt: probe.startedAt,
      stoppedAt: Date.now(),
      durationMs: Date.now() - probe.startedAt,
      attached: { sw: probe.swCount, home: probe.homeCount },
      filters: {
        scope: probe.scope,
        url_pattern: probe.urlPattern,
        message_pattern: probe.messagePattern,
        status_match: probe.statusMatch,
      },
      network: {
        total: requests.length,
        matchedStatus,
        byStatus,
        bySource,
        samples: trimmedRequestSamples,
      },
      messages: {
        total: messages.length,
        bySource: msgBySource,
        samples: trimmedMessageSamples,
      },
      stream: {
        network: probe.streamNetworkPath || null,
        messages: probe.streamMessagesPath || null,
      },
    };

    // Full arrays attached non-enumerably — excluded from JSON.stringify
    // but reachable via `summary._full` for artifact writers.
    Object.defineProperty(summary, '_full', {
      value: { requests, messages },
      enumerable: false,
    });

    this.#cdpProbeResults.set(name, summary);
    return summary;
  }
}

// Use the 'ws' library (EventEmitter API) instead of the Node global WebSocket
// (which is backed by undici and throws uncaught TypeErrors on certain close
// paths, crashing the recipe runner process).
const WsClient = require('ws');

class RawCdpClient {
  #socket;
  #nextId = 0;
  #pending = new Map();
  #opened;
  #eventListeners = new Set();

  constructor(webSocketDebuggerUrl) {
    this.#socket = new WsClient(webSocketDebuggerUrl);
    let openResolved = false;
    this.#opened = new Promise((resolve, reject) => {
      this.#socket.on('open', () => { openResolved = true; resolve(); });
      this.#socket.on('error', (err) => {
        if (!openResolved) {
          reject(err || new Error('CDP websocket open failed'));
        }
        // post-open errors: swallow so the recipe runner keeps running
      });
    });

    this.#socket.on('message', (data) => {
      const message = JSON.parse(String(data));
      if (!Object.prototype.hasOwnProperty.call(message, 'id')) {
        if (message.method) {
          for (const listener of this.#eventListeners) {
            try {
              listener(message);
            } catch {
              // listener errors must not break the socket dispatch
            }
          }
        }
        return;
      }

      const pending = this.#pending.get(message.id);
      if (!pending) {
        return;
      }
      this.#pending.delete(message.id);

      if (message.error) {
        pending.reject(new Error(message.error.message || `CDP error for request ${message.id}`));
        return;
      }
      pending.resolve(message.result || {});
    });

    this.#socket.on('close', () => {
      for (const pending of this.#pending.values()) {
        pending.reject(new Error('CDP websocket closed'));
      }
      this.#pending.clear();
    });
  }

  async send(method, params = {}) {
    await this.#opened;
    const id = ++this.#nextId;
    const payload = JSON.stringify({ id, method, params });

    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#socket.send(payload);
    });
  }

  onEvent(listener) {
    this.#eventListeners.add(listener);
    return () => this.#eventListeners.delete(listener);
  }
}

module.exports = { CdpSessionManager };
