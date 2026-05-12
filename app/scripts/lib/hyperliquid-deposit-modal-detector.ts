import browser from 'webextension-polyfill';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';

export const HYPERLIQUID_ORIGIN = 'https://app.hyperliquid.xyz';

export const HYPERLIQUID_DEPOSIT_MODAL_DETECTED_MESSAGE =
  'metamask:hyperliquidDepositModalDetected';

const DEFAULT_DETECTION_COOLDOWN_MS = 2_000;

const DIALOG_SELECTOR = [
  '[role="dialog"]',
  '[aria-modal="true"]',
  'dialog',
  '[data-radix-dialog-content]',
  '[data-headlessui-state]',
  '[class*="modal"]',
  '[class*="Modal"]',
  '[class*="dialog"]',
  '[class*="Dialog"]',
].join(',');

const REQUIRED_SIGNAL = {
  name: 'deposit',
  pattern: /\bdeposit(?:ing)?\b/iu,
};

const SUPPORTING_SIGNALS = [
  { name: 'usdc', pattern: /\busdc\b/iu },
  { name: 'arbitrum', pattern: /\barbitrum\b/iu },
  { name: 'amount', pattern: /\bamount\b/iu },
  { name: 'bridge', pattern: /\bbridge\b/iu },
  { name: 'max', pattern: /\bmax\b/iu },
  { name: 'add-funds', pattern: /\badd\s+funds?\b/iu },
  { name: 'transfer', pattern: /\btransfer\b/iu },
] as const;

type SignalName =
  | typeof REQUIRED_SIGNAL.name
  | (typeof SUPPORTING_SIGNALS)[number]['name'];

export type HyperliquidDepositModalDetection = {
  detectedAt: number;
  matchedSignals: SignalName[];
  element: {
    tagName: string;
    role?: string;
    ariaModal?: string;
  };
};

export type HyperliquidDepositModalDetectionMessage = {
  type: typeof HYPERLIQUID_DEPOSIT_MODAL_DETECTED_MESSAGE;
  payload: Omit<HyperliquidDepositModalDetection, 'element'> & {
    element: HyperliquidDepositModalDetection['element'];
  };
};

type StartDetectorOptions = {
  doc: Document;
  onDetected: (
    detection: HyperliquidDepositModalDetection,
  ) => void | Promise<void>;
  now?: () => number;
  detectionCooldownMs?: number;
};

type InitDetectorOptions = {
  doc?: Document;
  enabled?: boolean;
  location?: Location;
  runtime?: Pick<typeof browser.runtime, 'sendMessage'>;
};

export function isHyperliquidDepositModalDetectionTarget(
  location: Pick<Location, 'origin'> = window.location,
): boolean {
  return location.origin === HYPERLIQUID_ORIGIN;
}

export function getHyperliquidDepositModalDetection(
  doc: Document,
  now: () => number = Date.now,
): HyperliquidDepositModalDetection | null {
  const candidate = getCandidateElements(doc).find(
    isHyperliquidDepositModalElement,
  );

  if (!candidate) {
    return null;
  }

  return {
    detectedAt: now(),
    matchedSignals: getMatchedSignals(candidate),
    element: {
      tagName: candidate.tagName.toLowerCase(),
      role: candidate.getAttribute('role') ?? undefined,
      ariaModal: candidate.getAttribute('aria-modal') ?? undefined,
    },
  };
}

export function startHyperliquidDepositModalDetector({
  doc,
  onDetected,
  now = Date.now,
  detectionCooldownMs = DEFAULT_DETECTION_COOLDOWN_MS,
}: StartDetectorOptions): () => void {
  let lastDetectedAt = Number.NEGATIVE_INFINITY;
  let isCurrentlyDetected = false;
  let pending = false;

  const detect = () => {
    pending = false;

    const detection = getHyperliquidDepositModalDetection(doc, now);
    if (!detection) {
      isCurrentlyDetected = false;
      return;
    }

    if (isCurrentlyDetected) {
      return;
    }

    if (detection.detectedAt - lastDetectedAt < detectionCooldownMs) {
      return;
    }

    lastDetectedAt = detection.detectedAt;
    isCurrentlyDetected = true;
    onDetected(detection);
  };

  const scheduleDetection = () => {
    if (pending) {
      return;
    }

    pending = true;
    window.setTimeout(detect, 0);
  };

  const observer = new MutationObserver(scheduleDetection);

  observer.observe(doc.documentElement ?? doc, {
    attributes: true,
    attributeFilter: [
      'aria-expanded',
      'aria-hidden',
      'aria-modal',
      'class',
      'data-state',
      'hidden',
      'open',
      'role',
      'style',
    ],
    childList: true,
    subtree: true,
  });

  doc.addEventListener('click', scheduleDetection, true);
  doc.addEventListener('keyup', scheduleDetection, true);

  detect();

  return () => {
    observer.disconnect();
    doc.removeEventListener('click', scheduleDetection, true);
    doc.removeEventListener('keyup', scheduleDetection, true);
  };
}

export function initHyperliquidDepositModalDetector({
  doc = window.document,
  enabled = getIsHyperliquidDepositModalDetectionEnabled(),
  location = window.location,
  runtime = browser.runtime,
}: InitDetectorOptions = {}): (() => void) | undefined {
  if (!enabled || !isHyperliquidDepositModalDetectionTarget(location)) {
    return undefined;
  }

  return startHyperliquidDepositModalDetector({
    doc,
    async onDetected(detection) {
      try {
        await runtime.sendMessage({
          type: HYPERLIQUID_DEPOSIT_MODAL_DETECTED_MESSAGE,
          payload: detection,
        } satisfies HyperliquidDepositModalDetectionMessage);
      } catch (error) {
        console.debug(
          'MetaMask: Failed to send Hyperliquid deposit modal detection message.',
          error,
        );
      }
    },
  });
}

export function getIsHyperliquidDepositModalDetectionEnabled(): boolean {
  return getManifestFlags().testing?.hyperliquidDepositModalDetection === true;
}

export function isHyperliquidDepositModalDetectionMessage(
  message: unknown,
): message is HyperliquidDepositModalDetectionMessage {
  return (
    Boolean(message) &&
    typeof message === 'object' &&
    'type' in message &&
    message.type === HYPERLIQUID_DEPOSIT_MODAL_DETECTED_MESSAGE &&
    'payload' in message &&
    Boolean(message.payload) &&
    typeof message.payload === 'object'
  );
}

function getCandidateElements(doc: Document): HTMLElement[] {
  const dialogCandidates = Array.from(
    doc.querySelectorAll<HTMLElement>(DIALOG_SELECTOR),
  );

  const overlayCandidates = Array.from(
    doc.querySelectorAll<HTMLElement>('div, section, aside'),
  ).filter(isLikelyOverlayElement);

  return [...new Set([...dialogCandidates, ...overlayCandidates])];
}

function isHyperliquidDepositModalElement(element: HTMLElement): boolean {
  if (!isVisible(element)) {
    return false;
  }

  const matchedSignals = getMatchedSignals(element);

  return (
    matchedSignals.includes(REQUIRED_SIGNAL.name) &&
    matchedSignals.some((signal) => signal !== REQUIRED_SIGNAL.name)
  );
}

function getMatchedSignals(element: HTMLElement): SignalName[] {
  const normalizedText = normalizeText(element.textContent ?? '');
  const matchedSignals: SignalName[] = [];

  if (REQUIRED_SIGNAL.pattern.test(normalizedText)) {
    matchedSignals.push(REQUIRED_SIGNAL.name);
  }

  for (const signal of SUPPORTING_SIGNALS) {
    if (signal.pattern.test(normalizedText)) {
      matchedSignals.push(signal.name);
    }
  }

  return matchedSignals;
}

function normalizeText(text: string): string {
  return text.replace(/\s+/gu, ' ').trim();
}

function isLikelyOverlayElement(element: HTMLElement): boolean {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);

  if (!style) {
    return false;
  }

  const zIndex = Number.parseInt(style.zIndex, 10);
  const hasOverlayPosition =
    style.position === 'fixed' || style.position === 'absolute';

  return hasOverlayPosition && Number.isFinite(zIndex) && zIndex >= 10;
}

function isVisible(element: HTMLElement): boolean {
  if (element.closest('[hidden], [aria-hidden="true"]')) {
    return false;
  }

  const style = element.ownerDocument.defaultView?.getComputedStyle(element);

  return style?.display !== 'none' && style?.visibility !== 'hidden';
}
