import type { Page } from '@playwright/test';
import type {
  StateSnapshotCapability,
  StateSnapshot,
  StateOptions,
} from '@metamask/metamask-mcp-core';
import {
  getExtensionState,
  detectCurrentScreen,
} from '../launcher/state-inspector';

export type MetaMaskStateSnapshotCapabilityOptions = {
  defaultChainId?: number;
};

export class MetaMaskStateSnapshotCapability
  implements StateSnapshotCapability
{
  private readonly defaultChainId: number;

  constructor(options: MetaMaskStateSnapshotCapabilityOptions = {}) {
    this.defaultChainId = options.defaultChainId ?? 1337;
  }

  async getState(page: Page, options: StateOptions): Promise<StateSnapshot> {
    return getExtensionState(page, {
      extensionId: options.extensionId,
      chainId: options.chainId ?? this.defaultChainId,
    });
  }

  async detectCurrentScreen(page: Page): Promise<string> {
    return detectCurrentScreen(page);
  }
}
