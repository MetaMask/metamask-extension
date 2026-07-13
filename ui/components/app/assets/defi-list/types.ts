import type { CaipChainId } from '@metamask/utils';
import type { GroupedDeFiProtocolPosition } from './utils/group-defi-protocol-positions';

export type DeFiProtocolListItem = GroupedDeFiProtocolPosition & {
  marketValue: string;
  chainId: CaipChainId;
};
