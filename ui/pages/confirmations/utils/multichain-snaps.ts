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

export async function confirmTronStake(fromAccountId?: string) {
  const defaultParams = {
    fromAccountId: fromAccountId,
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

export async function validateTronStakeAmount(accountId?: string) {
  const defaultParams = {
    accountId: accountId,
    assetId: 'tron:728126428/slip44:195' as CaipAssetType,
    value: '1',
  };

  return await handleSnapRequest({
    snapId: 'local:http://localhost:8080',
    origin: 'metamask',
    handler: HandlerType.OnClientRequest,
    request: {
      method: 'onStakeAmountInput',
      params: defaultParams,
    },
  });
}

export async function confirmTronUnstake(accountId?: string) {

  const defaultParams = {
    accountId: accountId,
    assetId: 'tron:728126428/slip44:195' as CaipAssetType,
    options: { purpose: 'ENERGY' },
    value: '1',
  };

  return await handleSnapRequest({
    snapId: 'local:http://localhost:8080',
    origin: 'metamask',
    handler: HandlerType.OnClientRequest,
    request: {
      method: 'confirmUnstake',
      params: defaultParams,
    },
  });
}
