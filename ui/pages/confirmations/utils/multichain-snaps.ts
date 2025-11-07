import { HandlerType } from '@metamask/snaps-utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { SnapId, CaipAssetType } from '@metamask/snaps-sdk';

import { handleSnapRequest } from '../../../store/actions';

export async function sendMultichainTransactionForReview(
  fromAccount: InternalAccount,
  params: {
    fromAccountId: string;
    toAddress: string;
    assetId: CaipAssetType;
    amount: string;
  },
) {
  return await handleSnapRequest({
    snapId: fromAccount.metadata?.snap?.id as SnapId,
    origin: 'metamask',
    handler: HandlerType.OnClientRequest,
    request: {
      method: 'confirmSend',
      params,
    },
  });
}

export async function validateAmountMultichain(
  fromAccount: InternalAccount,
  params: {
    value: string;
    accountId: string;
    assetId: CaipAssetType;
  },
) {
  return await handleSnapRequest({
    snapId: fromAccount.metadata?.snap?.id as SnapId,
    origin: 'metamask',
    handler: HandlerType.OnClientRequest,
    request: {
      method: 'onAmountInput',
      params,
    },
  });
}

// {"accountId": "525249ab-21cc-43ab-b6c0-61373fdee1d5", "assetId": "tron:728126428/slip44:195", "options": {"purpose": "ENERGY"}, "value": "1"}

export async function confirmTronStake() {
  const defaultParams = {
    fromAccountId: 'b833d6a1-c07a-4405-9500-a9093b9eb4c7',
    assetId: 'tron:728126428/slip44:195' as CaipAssetType,
    options: { purpose: 'ENERGY' },
    value: '1',
  };

  return await handleSnapRequest({
    snapId: 'local:http://localhost:8080',
    origin: 'metamask',
    handler: HandlerType.OnClientRequest,
    request: {
      method: 'confirmStake',
      params: defaultParams,
    },
  });
}

