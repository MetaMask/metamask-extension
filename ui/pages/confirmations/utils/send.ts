import { ERC1155, ERC721 } from '@metamask/controller-utils';
import { Hex } from '@metamask/utils';
import {
  TransactionParams,
  TransactionType,
} from '@metamask/transaction-controller';
import { isNativeAddress } from '@metamask/bridge-controller';

import { Numeric } from '../../../../shared/modules/Numeric';
import {
  addTransactionAndRouteToConfirmationPage,
  findNetworkClientIdByChainId,
} from '../../../store/actions';
import { Asset } from '../types/send';
import {
  generateERC1155TransferData,
  generateERC20TransferData,
  generateERC721TransferData,
} from '../send-legacy/send.utils';

export const fromTokenMinimalUnit = (
  value: string,
  decimals?: number | string,
) => {
  const decimalValue = parseInt(decimals?.toString() ?? '0', 10);
  if (!decimalValue) {
    return value;
  }
  const multiplier = Math.pow(10, Number(decimalValue));
  return new Numeric(value, 16).times(multiplier, 10).toBase(16).toString();
};

export const toTokenMinimalUnit = (
  value: string,
  decimals?: number | string,
) => {
  const decimalValue = parseInt(decimals?.toString() ?? '0', 10);
  if (!decimalValue) {
    return value;
  }
  const multiplier = Math.pow(10, Number(decimalValue));
  return new Numeric(value, 16).divide(multiplier, 10).toBase(10).toString();
};

export function formatToFixedDecimals(
  value: string | undefined,
  decimalsToShow: string | number = 5,
) {
  if (value) {
    let decimals = parseInt(decimalsToShow?.toString());
    decimals = decimals < 5 ? decimals : 5;
    const val = new Numeric(value, 10);

    const minVal = 1 / Math.pow(10, decimals);
    if (val.lessThan(new Numeric(minVal, 10))) {
      return `< ${minVal}`;
    }

    const strValueArr = val.toString().split('.');
    if (!strValueArr[1]) {
      return strValueArr[0];
    }

    return `${strValueArr[0]}.${strValueArr[1].slice(0, decimals)}`.replace(
      /\.?0+$/,
      '',
    );
  }
  return '0';
}

export const prepareEVMTransaction = (
  asset: Asset,
  transactionParams: TransactionParams,
) => {
  const { from, to, value } = transactionParams;
  const trxnParams: TransactionParams = { from };

  const tokenValue = asset.tokenId
    ? value
    : fromTokenMinimalUnit(value ?? '0', asset.decimals);

  // Native token
  if (isNativeAddress(asset.address)) {
    trxnParams.data = '0x';
    trxnParams.to = to;
    trxnParams.value = tokenValue;
    return trxnParams;
  }

  // ERC1155 token
  if (asset.standard === ERC1155) {
    trxnParams.data = generateERC1155TransferData({
      fromAddress: from,
      toAddress: to,
      tokenId: asset.tokenId,
      amount: tokenValue,
    });
    trxnParams.to = asset.address;
    trxnParams.value = '0x0';
    return trxnParams;
  }

  // ERC721 token
  if (asset.standard === ERC721) {
    trxnParams.data = generateERC721TransferData({
      fromAddress: from,
      toAddress: to,
      tokenId: asset.tokenId,
    });
    trxnParams.to = asset.address;
    trxnParams.value = '0x0';
    return trxnParams;
  }

  // ERC20 token
  trxnParams.data = generateERC20TransferData({
    toAddress: to,
    amount: tokenValue,
    sendToken: asset,
  });
  trxnParams.to = asset.address;
  trxnParams.value = '0x0';
  return trxnParams;
};

export const submitEvmTransaction = async ({
  asset,
  chainId,
  from,
  to,
  value,
}: {
  asset: Asset;
  chainId: Hex;
  from: Hex;
  to: Hex;
  value: string;
}) => {
  const trxnParams = prepareEVMTransaction(asset, { from, to, value });
  const networkClientId = await findNetworkClientIdByChainId(chainId);
  return addTransactionAndRouteToConfirmationPage(trxnParams, {
    networkClientId,
    type: TransactionType.simpleSend,
  });
};
