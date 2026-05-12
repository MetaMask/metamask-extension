import type browser from 'webextension-polyfill';
import log from 'loglevel';
import type { HyperliquidDepositModalDetectionMessage } from './hyperliquid-deposit-modal-detector';
import {
  HYPERLIQUID_ORIGIN,
  isHyperliquidDepositModalDetectionMessage,
} from './hyperliquid-deposit-modal-detector';

const DEFAULT_TRIGGER_COOLDOWN_MS = 2_000;

type Runtime = Pick<typeof browser.runtime, 'onMessage'>;

type OpenDepositFlowContext = {
  tabId?: number;
  windowId?: number;
};

type RegisterHyperliquidDepositModalListenerOptions = {
  runtime: Runtime;
  openDepositFlow: (context: OpenDepositFlowContext) => void | Promise<void>;
  now?: () => number;
  triggerCooldownMs?: number;
  logger?: Pick<typeof log, 'info' | 'warn'>;
};

export function registerHyperliquidDepositModalListener({
  runtime,
  openDepositFlow,
  now = Date.now,
  triggerCooldownMs = DEFAULT_TRIGGER_COOLDOWN_MS,
  logger = log,
}: RegisterHyperliquidDepositModalListenerOptions): () => void {
  let lastTriggeredAt = Number.NEGATIVE_INFINITY;

  const handleDetectionMessage = async (
    message: HyperliquidDepositModalDetectionMessage,
    sender: browser.Runtime.MessageSender,
  ) => {
    const senderOrigin = getSenderOrigin(sender.url);

    if (senderOrigin !== HYPERLIQUID_ORIGIN) {
      logger.warn('Ignoring Hyperliquid deposit modal detection message', {
        reason: 'invalid-origin',
        senderOrigin,
        tabId: sender.tab?.id,
        frameId: sender.frameId,
      });

      return { acknowledged: false, reason: 'invalid-origin' };
    }

    const triggeredAt = now();

    if (triggeredAt - lastTriggeredAt < triggerCooldownMs) {
      return { acknowledged: true, suppressed: true };
    }

    lastTriggeredAt = triggeredAt;

    logger.info('Hyperliquid deposit modal detected', {
      matchedSignals: message.payload.matchedSignals,
      tabId: sender.tab?.id,
      frameId: sender.frameId,
    });

    await openDepositFlow({
      tabId: sender.tab?.id,
      windowId: sender.tab?.windowId,
    });

    return { acknowledged: true };
  };

  const listener = (
    message: unknown,
    sender: browser.Runtime.MessageSender,
  ) => {
    if (isHyperliquidDepositModalDetectionMessage(message)) {
      return handleDetectionMessage(message, sender);
    }

    return undefined;
  };

  runtime.onMessage.addListener(listener);

  return () => runtime.onMessage.removeListener(listener);
}

function getSenderOrigin(senderUrl: string | undefined): string | undefined {
  if (!senderUrl) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(senderUrl);

    if (
      parsedUrl.protocol === 'chrome-extension:' ||
      parsedUrl.protocol === 'moz-extension:'
    ) {
      return `${parsedUrl.protocol}//${parsedUrl.host}`;
    }

    return parsedUrl.origin;
  } catch {
    return undefined;
  }
}
