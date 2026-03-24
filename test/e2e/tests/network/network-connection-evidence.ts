import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Hex } from '@metamask/utils';
import { WINDOW_TITLES } from '../../constants';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import type { Driver } from '../../webdriver/driver';

/**
 * Matches {@link test/e2e/webdriver/driver.js} `sanitizeTestTitle` for artifact paths.
 *
 * @param testTitle - Full Mocha test title used for artifact directory names.
 */
export function sanitizeTestTitleForArtifacts(testTitle: string): string {
  const MAX_DIR_NAME_LENGTH = 200;
  let sanitized = testTitle
    .toLowerCase()
    .replace(/[<>:"/\\|?*\r\n]/gu, '')
    .trim()
    .replace(/\s+/gu, '-')
    .replace(/[^a-z0-9-]+/gu, '-')
    .replace(/--+/gu, '-')
    .replace(/^-+|-+$/gu, '');

  if (sanitized.length > MAX_DIR_NAME_LENGTH) {
    let truncated = sanitized.substring(0, MAX_DIR_NAME_LENGTH);
    const lastDashIndex = truncated.lastIndexOf('-');
    if (lastDashIndex > MAX_DIR_NAME_LENGTH * 0.7) {
      truncated = truncated.substring(0, lastDashIndex);
    }
    sanitized = truncated.replace(/-+$/gu, '');
  }
  return sanitized;
}

export type EvidenceStep = {
  slug: string;
  label: string;
  /** Relative to artifact dir */
  dappPrePng?: string;
  dappPostPng?: string;
  confirmPng?: string;
  jsonRpcResponseRaw: string;
  contractStatusText: string;
  /** 32-byte tx hash from `eth_sendTransaction` / contract deploy when detectable */
  transactionHash: string | null;
  /** Non-tx `result` (e.g. signature hex) truncated for the report */
  otherResultPreview: string | null;
  explorerUrl: string | null;
};

function explorerTxUrl(chainId: Hex, txHash: string): string | null {
  const h = txHash.startsWith('0x') ? txHash : `0x${txHash}`;
  if (chainId === CHAIN_IDS.MONAD_TESTNET) {
    return `https://explorer.monad.xyz/tx/${h}`;
  }
  if (chainId === CHAIN_IDS.SEI) {
    return `https://seitrace.com/tx/${h}`;
  }
  return null;
}

const TX_HASH_HEX_LENGTH = 66;

function parseJsonRpcPayload(raw: string): {
  transactionHash: string | null;
  otherResultPreview: string | null;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { transactionHash: null, otherResultPreview: null };
  }
  try {
    const j = JSON.parse(trimmed) as { result?: unknown; error?: unknown };
    if (j.error) {
      return {
        transactionHash: null,
        otherResultPreview: JSON.stringify(j.error).slice(0, 500),
      };
    }
    const r = j.result;
    if (typeof r === 'string') {
      if (r.startsWith('0x') && r.length === TX_HASH_HEX_LENGTH) {
        return { transactionHash: r, otherResultPreview: null };
      }
      return {
        transactionHash: null,
        otherResultPreview: r.length > 200 ? `${r.slice(0, 200)}…` : r,
      };
    }
    if (r !== undefined) {
      const s = JSON.stringify(r);
      return {
        transactionHash: null,
        otherResultPreview: s.length > 500 ? `${s.slice(0, 500)}…` : s,
      };
    }
  } catch {
    if (trimmed.startsWith('0x') && trimmed.length === TX_HASH_HEX_LENGTH) {
      return { transactionHash: trimmed, otherResultPreview: null };
    }
    return {
      transactionHash: null,
      otherResultPreview: trimmed.slice(0, 500),
    };
  }
  return { transactionHash: null, otherResultPreview: null };
}

async function readDappField(
  driver: Driver,
  selector: string,
): Promise<string> {
  return driver.executeScript((sel: string) => {
    const el = document.querySelector(sel);
    if (!el) {
      return '';
    }
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      return el.value;
    }
    return el.textContent ?? '';
  }, selector) as Promise<string>;
}

/**
 * Injected as a string so Selenium does not serialize TS/async helpers (`__name`, etc.) into
 * the page context.
 */
const INSTALL_TEST_DAPP_RPC_CAPTURE_SCRIPT = `
(function () {
  var FLAG = '__mmNetworkConnectionEvidenceRpcCapture';
  function writeRpcCapture(method, result) {
    var ta = document.querySelector('#json-rpc-response');
    var payload = JSON.stringify({ method: method, result: result });
    if (ta && ta.tagName === 'TEXTAREA') {
      ta.value = payload;
    }
  }
  function wrapEthereum(eth) {
    if (!eth || typeof eth !== 'object' || eth[FLAG]) {
      return;
    }
    var request = eth.request;
    if (typeof request === 'function') {
      var origRequest = request.bind(eth);
      eth.request = function (args) {
        return origRequest(args).then(function (out) {
          writeRpcCapture(args && args.method != null ? args.method : null, out);
          return out;
        });
      };
    }
    var sendAsync = eth.sendAsync;
    if (typeof sendAsync === 'function') {
      var origSendAsync = sendAsync.bind(eth);
      eth.sendAsync = function (payload, cb) {
        return origSendAsync(payload, function (err, response) {
          if (
            !err &&
            response &&
            payload &&
            !Array.isArray(payload) &&
            typeof response === 'object' &&
            response !== null &&
            Object.prototype.hasOwnProperty.call(response, 'result')
          ) {
            writeRpcCapture(
              payload.method != null ? payload.method : null,
              response.result,
            );
          }
          cb(err, response);
        });
      };
    }
    eth[FLAG] = true;
  }
  var ethereum = window.ethereum;
  wrapEthereum(ethereum);
  if (ethereum && ethereum.providers && Array.isArray(ethereum.providers)) {
    for (var i = 0; i < ethereum.providers.length; i += 1) {
      wrapEthereum(ethereum.providers[i]);
    }
  }
})();
`;

/**
 * Wrap `window.ethereum.request` / `sendAsync` so each successful RPC result is written to
 * `#json-rpc-response` as `{"method","result"}`. The bundled test dapp does not populate
 * that textarea for send/sign flows; this keeps evidence collection working without forking
 * `@metamask/test-dapp`.
 *
 * @param driver - WebDriver session; must be on the E2E Test Dapp window.
 */
export async function ensureTestDappRpcResultCapture(
  driver: Driver,
): Promise<void> {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.executeScript(INSTALL_TEST_DAPP_RPC_CAPTURE_SCRIPT);
}

export class NetworkConnectionEvidenceCollector {
  readonly steps: EvidenceStep[] = [];

  private readonly artifactDir: string;

  private readonly networkLabel: string;

  private readonly chainId: Hex;

  private readonly testTitle: string;

  constructor(options: {
    networkLabel: string;
    chainId: Hex;
    testTitle: string;
    browser: string;
  }) {
    this.networkLabel = options.networkLabel;
    this.chainId = options.chainId;
    this.testTitle = options.testTitle;
    const sub = sanitizeTestTitleForArtifacts(options.testTitle);
    this.artifactDir = path.join(
      process.cwd(),
      'test-artifacts',
      options.browser,
      sub,
    );
  }

  async captureDappPre(driver: Driver, slug: string): Promise<void> {
    await ensureTestDappRpcResultCapture(driver);
    const name = `evidence-dapp-pre-${slug}`;
    await driver.takeScreenshot(this.testTitle, name);
    this.ensureStep(slug, networkConnectionStepLabel(slug)).dappPrePng =
      `${name}.png`;
  }

  async captureDappPostAndRecordRpc(
    driver: Driver,
    slug: string,
    confirmPng: string,
  ): Promise<void> {
    await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await driver.delay(1200);
    const postName = `evidence-dapp-post-${slug}`;
    await driver.takeScreenshot(this.testTitle, postName);

    const jsonRpcResponseRaw = (await readDappField(
      driver,
      '#json-rpc-response',
    )) as string;
    const contractStatusText = (
      (await readDappField(driver, '#contractStatus')) as string
    ).trim();

    const { transactionHash, otherResultPreview } =
      parseJsonRpcPayload(jsonRpcResponseRaw);

    const step = this.ensureStep(slug, networkConnectionStepLabel(slug));
    step.dappPostPng = `${postName}.png`;
    step.confirmPng = `${confirmPng}.png`;
    step.jsonRpcResponseRaw = jsonRpcResponseRaw;
    step.contractStatusText = contractStatusText;
    step.transactionHash = transactionHash;
    step.otherResultPreview = otherResultPreview;
    step.explorerUrl = transactionHash
      ? explorerTxUrl(this.chainId, transactionHash)
      : null;
  }

  private ensureStep(slug: string, label: string): EvidenceStep {
    let s = this.steps.find((x) => x.slug === slug);
    if (!s) {
      s = {
        slug,
        label,
        jsonRpcResponseRaw: '',
        contractStatusText: '',
        transactionHash: null,
        otherResultPreview: null,
        explorerUrl: null,
      };
      this.steps.push(s);
    }
    return s;
  }

  async writeReports(): Promise<{ htmlPath: string; jsonPath: string }> {
    await fs.mkdir(this.artifactDir, { recursive: true });
    const jsonPath = path.join(
      this.artifactDir,
      'network-connection-report.json',
    );
    const htmlPath = path.join(
      this.artifactDir,
      'network-connection-report.html',
    );

    const payload = {
      generatedAt: new Date().toISOString(),
      network: this.networkLabel,
      chainId: this.chainId,
      steps: this.steps,
    };
    await fs.writeFile(jsonPath, JSON.stringify(payload, null, 2), 'utf8');

    const rows = this.steps
      .map((step) => {
        const txCell = formatTxHashCell(step);
        const other = step.otherResultPreview
          ? `<pre class="rpc">${escapeHtml(step.otherResultPreview)}</pre>`
          : '—';
        const contract =
          step.contractStatusText && step.contractStatusText !== 'Not clicked'
            ? escapeHtml(step.contractStatusText)
            : '—';
        const img = (rel?: string) =>
          rel
            ? `<a href="${escapeHtml(rel)}"><img src="${escapeHtml(rel)}" alt="" loading="lazy" /></a>`
            : '—';
        return `<tr>
  <td>${escapeHtml(step.label)}</td>
  <td>${img(step.dappPrePng)}</td>
  <td>${img(step.confirmPng)}</td>
  <td>${img(step.dappPostPng)}</td>
  <td>${txCell}</td>
  <td>${other}</td>
  <td>${contract}</td>
  <td><pre class="rpc">${escapeHtml(truncate(step.jsonRpcResponseRaw, 2000))}</pre></td>
</tr>`;
      })
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Network connection evidence — ${escapeHtml(this.networkLabel)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1.5rem; color: CanvasText; }
    h1 { font-size: 1.25rem; }
    table { border-collapse: collapse; width: 100%; font-size: 0.85rem; }
    th, td { border: 1px solid GrayText; padding: 0.5rem; vertical-align: top; }
    th { background: ButtonFace; text-align: left; }
    img { max-width: 220px; height: auto; display: block; }
    pre.rpc { white-space: pre-wrap; word-break: break-all; margin: 0; font-size: 0.75rem; max-height: 12rem; overflow: auto; }
    .meta { color: GrayText; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <h1>Network connection test evidence</h1>
  <p class="meta">Network: <strong>${escapeHtml(this.networkLabel)}</strong> · chainId <code>${escapeHtml(this.chainId)}</code> · ${escapeHtml(payload.generatedAt)}</p>
  <p class="meta">Screenshots come from the <strong>E2E Test Dapp</strong> (pre-action, MetaMask confirmation, post-confirmation). RPC results are mirrored into the dapp&rsquo;s JSON-RPC textarea via an injected <code>window.ethereum.request</code> wrapper. Transaction links are best-effort explorer URLs.</p>
  <table>
    <thead>
      <tr>
        <th>Action</th>
        <th>Dapp (pre)</th>
        <th>MetaMask confirm</th>
        <th>Dapp (post)</th>
        <th>Tx hash / link</th>
        <th>Other result</th>
        <th>Contract status</th>
        <th>JSON-RPC response (raw)</th>
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</body>
</html>`;
    await fs.writeFile(htmlPath, html, 'utf8');
    return { htmlPath, jsonPath };
  }
}

export function networkConnectionStepLabel(slug: string): string {
  const map: Record<string, string> = {
    'simple-send': 'Simple send',
    'create-token': 'Create token (ERC-20 deploy)',
    'erc721-deploy': 'ERC-721 deploy',
    'personal-sign': 'Personal sign',
    'sign-typed-data-v1': 'Sign typed data (v1)',
    'sign-typed-data-v3': 'Sign typed data v3',
    'sign-typed-data-v4': 'Sign typed data v4',
    permit: 'Permit',
    'erc1155-deploy': 'ERC-1155 deploy',
  };
  return map[slug] ?? slug;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;');
}

function formatTxHashCell(step: EvidenceStep): string {
  if (!step.transactionHash) {
    return '—';
  }
  if (step.explorerUrl) {
    return `<a href="${escapeHtml(step.explorerUrl)}">${escapeHtml(step.transactionHash)}</a>`;
  }
  return escapeHtml(step.transactionHash);
}

function truncate(s: string, max: number): string {
  if (s.length <= max) {
    return s;
  }
  return `${s.slice(0, max)}…`;
}
