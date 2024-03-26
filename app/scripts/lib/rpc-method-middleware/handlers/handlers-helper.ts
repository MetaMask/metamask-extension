import type {
  PermissionSubjectMetadata,
  SubjectType,
} from '@metamask/permission-controller';
import type { Json } from '@metamask/utils';

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

export type SubjectMetadataToAdd = PermissionSubjectMetadata & {
  name?: string | null;
  subjectType?: SubjectType | null;
  extensionId?: string | null;
  iconUrl?: string | null;
} & Record<string, Json>;

export type GetAccountsType = () => Promise<string[]>;
export type GetProviderStateType = (
  origin: string,
) => Promise<ProviderStateHandlerResult>;
export type GetWeb3ShimUsageStateType = (origin: string) => undefined | 1 | 2;
export type SetWeb3ShimUsageRecordedType = (origin: string) => void;
export type AddSubjectMetadata = (metadata: SubjectMetadataToAdd) => void;
