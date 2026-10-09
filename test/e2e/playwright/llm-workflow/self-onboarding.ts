import { randomBytes } from 'node:crypto';

import type { Page } from '@playwright/test';

const CANARY_SRP_PREFIX = 'CANARY-NOT-A-REAL-SRP-';
const PASSWORD_RANDOM_BYTES = 18;

type BackgroundCall = {
  method: string;
  params: unknown[];
};

type OnboardingPayload = {
  password: string;
  encodedSeedPhrase: number[];
};

type BackgroundPort = {
  postMessage: (message: unknown) => void;
  onMessage: {
    addListener: (listener: (message: unknown) => void) => void;
    removeListener: (listener: (message: unknown) => void) => void;
  };
  onDisconnect: {
    addListener: (listener: () => void) => void;
  };
};

/**
 * Normalizes a secret recovery phrase to single-spaced words.
 *
 * @param phrase - The phrase supplied by the caller.
 * @returns The normalized phrase.
 */
export function normalizeSecretRecoveryPhrase(phrase: string): string {
  const words = phrase
    .trim()
    .split(/\s+/u)
    .filter((word) => word.length > 0);
  if (words.length !== 12 && words.length !== 24) {
    throw new Error('secret recovery phrase must be 12 or 24 words');
  }
  if (phrase.startsWith(CANARY_SRP_PREFIX)) {
    throw new Error('marker strings cannot onboard MetaMask');
  }
  return words.join(' ');
}

/**
 * Encodes a secret recovery phrase as the UTF-8 byte list the background
 * vault API expects.
 *
 * @param phrase - A normalized secret recovery phrase.
 * @returns UTF-8 code units.
 */
export function encodeSecretRecoveryPhrase(phrase: string): number[] {
  return Array.from(Buffer.from(phrase, 'utf8'));
}

/**
 * Runs inside the extension page. Opens a trusted UI port and restores the
 * vault, then marks onboarding complete. Errors name the background method
 * only, so a thrown message cannot carry the phrase or password.
 *
 * @param payload - The vault password and the encoded phrase.
 */
export async function completeOnboardingInPage(
  payload: OnboardingPayload,
): Promise<void> {
  const runtime = (
    globalThis as unknown as {
      chrome?: {
        runtime?: { connect?: (info: { name: string }) => BackgroundPort };
      };
    }
  ).chrome?.runtime;
  if (!runtime?.connect) {
    throw new Error('self-onboarding failed');
  }

  const port = runtime.connect({ name: 'fullscreen' });
  const call = (method: string, params: unknown[]) =>
    new Promise<void>((resolve, reject) => {
      let settled = false;
      const id = Math.floor(Math.random() * 1_000_000_000);
      const handles: {
        timer?: ReturnType<typeof setTimeout>;
        onMessage?: (message: unknown) => void;
      } = {};
      const finish = (error?: Error) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(handles.timer);
        if (handles.onMessage) {
          port.onMessage.removeListener(handles.onMessage);
        }
        if (error) {
          reject(error);
          return;
        }
        resolve();
      };
      const onMessage = (message: unknown) => {
        if (
          typeof message !== 'object' ||
          message === null ||
          !('name' in message) ||
          message.name !== 'controller' ||
          !('data' in message) ||
          typeof message.data !== 'object' ||
          message.data === null ||
          !('id' in message.data) ||
          message.data.id !== id
        ) {
          return;
        }
        if ('error' in message.data && message.data.error) {
          finish(new Error(method));
          return;
        }
        finish();
      };
      handles.onMessage = onMessage;
      handles.timer = setTimeout(() => {
        finish(new Error(method));
      }, 60_000);
      port.onMessage.addListener(onMessage);
      port.onDisconnect.addListener(() => {
        finish(new Error(method));
      });
      port.postMessage({
        name: 'controller',
        data: { id, jsonrpc: '2.0', method, params },
      });
    });

  const calls: BackgroundCall[] = [
    {
      method: 'createNewVaultAndRestore',
      params: [payload.password, payload.encodedSeedPhrase],
    },
    { method: 'setFirstTimeFlowType', params: ['import'] },
    { method: 'setSeedPhraseBackedUp', params: [true] },
    { method: 'setTermsOfUseLastAgreed', params: [Date.now()] },
    { method: 'completeOnboarding', params: [] },
    { method: 'setHasSeenOnboardingCompletionPage', params: [true] },
  ];

  for (const backgroundCall of calls) {
    await call(backgroundCall.method, backgroundCall.params);
  }
}

/**
 * Restores a vault from `phrase` and completes onboarding through the
 * extension background API. The vault password is generated here and dropped
 * before this function returns.
 *
 * @param page - The extension page that can reach `chrome.runtime`.
 * @param phrase - The secret recovery phrase to restore.
 */
export async function runSelfOnboarding(
  page: Pick<Page, 'evaluate'>,
  phrase: string,
): Promise<void> {
  const normalized = normalizeSecretRecoveryPhrase(phrase);
  const payload: OnboardingPayload = {
    password: randomBytes(PASSWORD_RANDOM_BYTES).toString('base64'),
    encodedSeedPhrase: encodeSecretRecoveryPhrase(normalized),
  };
  try {
    await page.evaluate(completeOnboardingInPage, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (
      message.length > 0 &&
      !message.includes(normalized) &&
      !message.includes(payload.password)
    ) {
      throw new Error(`self-onboarding failed: ${message}`);
    }
    throw new Error('self-onboarding failed');
  } finally {
    payload.password = '';
    payload.encodedSeedPhrase = [];
  }
}
