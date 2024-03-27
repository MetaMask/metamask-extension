import type {
  PermissionSubjectMetadata,
  SubjectType,
} from '@metamask/permission-controller';
import type { Json } from '@metamask/utils';

export type HandlerWrapper = {
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

export type SubjectMetadataToAdd = PermissionSubjectMetadata & {
  name?: string | null;
  subjectType?: SubjectType | null;
  extensionId?: string | null;
  iconUrl?: string | null;
} & Record<string, Json>;

export type AddSubjectMetadata = (metadata: SubjectMetadataToAdd) => void;
export type GetAccounts = () => Promise<string[]>;
export type GetProviderState = (
  origin: string,
) => Promise<ProviderStateHandlerResult>;
export type GetWeb3ShimUsageState = (origin: string) => undefined | 1 | 2;
export type HandleWatchAssetRequest = ({
  asset,
  type,
  origin,
  networkClientId,
}: Record<string, string>) => Promise<void>;
export type SetWeb3ShimUsageRecorded = (origin: string) => void;
