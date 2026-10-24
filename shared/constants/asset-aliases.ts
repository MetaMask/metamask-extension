import { CaipAssetType } from '@metamask/utils';
import {
  ARC_ERC20_USDC_ASSET_ID,
  ARC_NATIVE_ASSET_ID,
} from '#shared/constants/network';

/**
 * Assets that can be reported under more than one CAIP-19 id but are treated
 * as a single asset by the wallet. Maps each alias (lowercase) to the id the
 * wallet uses for the asset.
 */
export const assetIdAliases: ReadonlyMap<CaipAssetType, CaipAssetType> =
  new Map([
    // Arc USDC is both the native token and an ERC-20 contract; transfers are
    // reported under either id depending on how they were sent.
    [ARC_ERC20_USDC_ASSET_ID, ARC_NATIVE_ASSET_ID],
  ]);
