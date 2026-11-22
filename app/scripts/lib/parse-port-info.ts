import browser from 'webextension-polyfill';
import type { Runtime } from 'webextension-polyfill';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
  PLATFORM_FIREFOX,
} from '../../../shared/constants/app';
import { getPlatform } from './util';

const metamaskInternalProcessHash: Record<string, true> = {
  [ENVIRONMENT_TYPE_POPUP]: true,
  [ENVIRONMENT_TYPE_NOTIFICATION]: true,
  [ENVIRONMENT_TYPE_FULLSCREEN]: true,
};

export type ParsedPortInfo = {
  processName: Runtime.Port['name'];
  senderUrl: URL | null;
  isMetaMaskUIPort: boolean;
};

/**
 * Parses port connection info for routing decisions.
 * Determines if the port is from the MetaMask UI (popup, notification, fullscreen)
 * vs a contentscript injected into a regular web page.
 *
 * @param port - The port to parse.
 * @returns Parsed port info.
 */
export function parsePortInfo(
  port: Pick<Runtime.Port, 'name' | 'sender'>,
): ParsedPortInfo {
  const isFirefox = getPlatform() === PLATFORM_FIREFOX;
  const processName = port.name;
  const senderUrl = port.sender?.url ? new URL(port.sender.url) : null;

  let isMetaMaskUIPort;
  if (isFirefox) {
    isMetaMaskUIPort = Boolean(metamaskInternalProcessHash[processName]);
  } else {
    isMetaMaskUIPort =
      senderUrl?.origin === `chrome-extension://${browser.runtime.id}`;
  }

  return { processName, senderUrl, isMetaMaskUIPort };
}
