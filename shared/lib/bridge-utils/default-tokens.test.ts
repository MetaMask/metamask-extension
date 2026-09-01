import {
  formatChainIdToCaip,
  formatChainIdToDec,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { BRIDGE_CHAINID_TO_DEFAULT_FROM_TOKEN } from '../../constants/bridge';
import { CHAIN_IDS } from '../../constants/network';
import { getDefaultBridgeFromToken } from './default-tokens';

describe('getDefaultBridgeFromToken', () => {
  const arcCaipChainId = formatChainIdToCaip(CHAIN_IDS.ARC);
  const arcDefaultFromToken =
    BRIDGE_CHAINID_TO_DEFAULT_FROM_TOKEN[
      arcCaipChainId as keyof typeof BRIDGE_CHAINID_TO_DEFAULT_FROM_TOKEN
    ];

  if (!arcDefaultFromToken) {
    throw new Error('Arc does not have a default bridge source token');
  }

  it('returns a configured override for a hex chain ID', () => {
    expect(getDefaultBridgeFromToken(CHAIN_IDS.ARC)).toStrictEqual({
      ...arcDefaultFromToken,
      chainId: formatChainIdToDec(CHAIN_IDS.ARC),
    });
  });

  it('returns a configured override for a CAIP chain ID', () => {
    expect(getDefaultBridgeFromToken(arcCaipChainId)).toStrictEqual({
      ...arcDefaultFromToken,
      chainId: formatChainIdToDec(CHAIN_IDS.ARC),
    });
  });

  it('returns the native asset when the chain has no override', () => {
    expect(getDefaultBridgeFromToken(CHAIN_IDS.MAINNET)).toStrictEqual(
      getNativeAssetForChainId(CHAIN_IDS.MAINNET),
    );
  });
});
