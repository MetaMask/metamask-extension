export type HandlerWrapperType = {
  methodNames: [string];
  hookNames: Record<string, boolean>;
};

/**
 * @typedef {object} ProviderStateHandlerResult
 * @property {string} chainId - The current chain ID.
 * @property {boolean} isUnlocked - Whether the extension is unlocked or not.
 * @property {string} networkVersion - The current network ID.
 * @property {string[]} accounts - List of permitted accounts for the specified origin.
 */
export type ProviderStateHandlerResult = {
  chainId: string;
  isUnlocked: boolean;
  networkVersion: string;
  accounts: string[];
};

export type getProviderStateType = (
  origin: string,
) => Promise<ProviderStateHandlerResult>;

export type getAccountsType = () => Promise<string[]>;

export type getWeb3ShimUsageStateType = (origin: string) => undefined | 1 | 2;
export type setWeb3ShimUsageRecordedType = (origin: string) => void;
