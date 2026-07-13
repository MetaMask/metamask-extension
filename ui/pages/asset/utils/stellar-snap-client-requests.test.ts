import { HandlerType } from '@metamask/snaps-utils';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';

import { STELLAR_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/stellar-wallet-snap';
import * as storeActions from '../../../store/actions';
import { requestStellarChangeTrustOptAdd } from './stellar-snap-client-requests';

describe('stellar-snap-client-requests', () => {
  beforeEach(() => {
    jest.spyOn(storeActions, 'handleSnapRequest').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests changeTrustOpt add via OnClientRequest', async () => {
    const assetId =
      'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' as CaipAssetType;

    await requestStellarChangeTrustOptAdd({
      accountId: 'acc-1',
      assetId,
      scope: 'stellar:pubnet' as CaipChainId,
      limit: '100',
    });

    expect(storeActions.handleSnapRequest).toHaveBeenCalledWith({
      snapId: STELLAR_WALLET_SNAP_ID,
      origin: 'metamask',
      handler: HandlerType.OnClientRequest,
      request: {
        method: 'changeTrustOpt',
        params: {
          accountId: 'acc-1',
          assetId,
          scope: 'stellar:pubnet',
          limit: '100',
          action: 'add',
        },
      },
    });
  });
});
