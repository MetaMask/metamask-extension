import { ERC1155, ERC20, ERC721 } from '@metamask/controller-utils';
import { Hex } from '@metamask/utils';
import {
  TransactionParams,
  TransactionType,
} from '@metamask/transaction-controller';
import { addHexPrefix } from 'ethereumjs-util';
import { useHistory } from 'react-router-dom';

import { Numeric, NumericBase } from '../../../../shared/modules/Numeric';
import {
  addTransactionAndRouteToConfirmationPage,
  findNetworkClientIdByChainId,
  getLayer1GasFeeValue,
} from '../../../store/actions';
import { Asset } from '../types/send';
import {
  generateERC1155TransferData,
  generateERC20TransferData,
  generateERC721TransferData,
} from '../send-legacy/send.utils';
import { SEND_ROUTE } from '../../../helpers/constants/routes';

export const trimTrailingZeros = (numStr: string) => {
  return numStr.replace(/(\.\d*?[1-9])0+$/gu, '$1').replace(/\.0*$/u, '');
};

export const removeAdditionalDecimalPlaces = (
  value: string,
  decimals: string | number | undefined,
) => {
  if (!value) {
    return undefined;
  }
  const decimalValue = parseInt(decimals?.toString() ?? '0', 10);
  const result = value.replace(/^-/u, '').split('.');
  const intPart = result[0];
  let fracPart = result[1] ?? '';

  if (fracPart.length > decimalValue) {
    fracPart = fracPart.slice(0, decimalValue);
  }

  return fracPart ? `${intPart}.${fracPart}` : intPart;
};

export const fromTokenMinUnitsNumeric = (
  value: string,
  base: NumericBase,
  decimals?: number | string,
) => {
  const decimalValue = parseInt(decimals?.toString() ?? '0', 10);
  const multiplier = Math.pow(10, Number(decimalValue));
  return new Numeric(value, base).times(multiplier, 10);
};

export const fromTokenMinimalUnitsNumeric = (
  value: string,
  decimals?: number | string,
) => fromTokenMinUnitsNumeric(value, 10, decimals);

export const fromTokenMinimalUnits = (
  value: string,
  decimals?: number | string,
) =>
  addHexPrefix(
    fromTokenMinimalUnitsNumeric(value, decimals).toBase(16).toString(),
  );

export const fromTokenMinimalUnitsHexNumeric = (
  value: string,
  decimals?: number | string,
) => fromTokenMinUnitsNumeric(value, 16, decimals);

export const toTokenMinimalUnitNumeric = (
  value: string,
  decimals: number | string = 0,
  base?: NumericBase,
) => {
  const decimalValue = parseInt(decimals?.toString() ?? '0', 10);
  const multiplier = Math.pow(10, Number(decimalValue));
  return new Numeric(value, base ?? 16).divide(multiplier, 10);
};

export const toTokenMinimalUnit = (
  value: string,
  decimals: number | string = 0,
  base?: NumericBase,
) => {
  return removeAdditionalDecimalPlaces(
    toTokenMinimalUnitNumeric(value, decimals, base).toBase(10).toString(),
    decimals,
  );
};

export function formatToFixedDecimals(
  value: string | undefined,
  decimalsToShow: string | number = 5,
  trimTrailingZerosEnabled = true,
) {
  if (!value || !isValidPositiveNumericString(value)) {
    return '0';
  }

  const val = new Numeric(value, 10);
  if (val.isZero()) {
    return '0';
  }
  let decimals = parseInt(decimalsToShow?.toString(), 10);
  decimals = decimals < 5 ? decimals : 5;

  const minVal = 1 / Math.pow(10, decimals);
  if (val.lessThan(new Numeric(minVal, 10))) {
    return `< ${minVal}`;
  }

  const strValueArr = val.toString().split('.');
  const intPart = strValueArr[0];
  let fracPart = strValueArr[1] ?? '';

  if (fracPart.length > decimals) {
    fracPart = fracPart.slice(0, decimals);
  } else {
    fracPart = fracPart.padEnd(decimals, '0');
  }

  if (!fracPart) {
    return intPart;
  }

  return trimTrailingZerosEnabled
    ? trimTrailingZeros(`${intPart}.${fracPart}`)
    : `${intPart}.${fracPart}`;
}

export const prepareEVMTransaction = (
  asset: Asset,
  transactionParams: TransactionParams,
  hexData: Hex = '0x',
) => {
  const { from, to, value } = transactionParams;
  const trxnParams: TransactionParams = { from };

  const tokenValue = asset.tokenId
    ? value
    : fromTokenMinimalUnits(value ?? '0', asset.decimals);

  // Native token
  if (asset.isNative) {
    trxnParams.data = hexData;
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
  hexData,
  to,
  value,
}: {
  asset: Asset;
  chainId: Hex;
  from: Hex;
  hexData?: Hex;
  to: Hex;
  value: string;
}) => {
  const trxnParams = prepareEVMTransaction(asset, { from, to, value }, hexData);
  const networkClientId = await findNetworkClientIdByChainId(chainId);

  let transactionType;
  if (asset.isNative) {
    transactionType = TransactionType.simpleSend;
  } else if (asset.standard === ERC20) {
    transactionType = TransactionType.tokenMethodTransfer;
  } else if (asset.standard === ERC721) {
    transactionType = TransactionType.tokenMethodTransferFrom;
  } else if (asset.standard === ERC1155) {
    transactionType = TransactionType.tokenMethodSafeTransferFrom;
  }

  return addTransactionAndRouteToConfirmationPage(trxnParams, {
    networkClientId,
    type: transactionType,
  });
};

export const getLayer1GasFees = async ({
  asset,
  chainId,
  from,
  value,
}: {
  asset: Asset;
  chainId: Hex;
  from: Hex;
  value: string;
}): Promise<Hex | undefined> => {
  return (await getLayer1GasFeeValue({
    chainId,
    transactionParams: {
      value: fromTokenMinimalUnits(value, asset.decimals),
      from,
    },
  })) as Hex | undefined;
};

export function isValidPositiveNumericString(str: string) {
  const decimalRegex = /^(\d+(\.\d+)?|\.\d+)$/u;

  if (!decimalRegex.test(str)) {
    return false;
  }

  try {
    const num = new Numeric(str, 10);
    return num.greaterThanOrEqualTo(new Numeric('0', 10));
  } catch (err) {
    return false;
  }
}

export function convertedCurrency(
  value: string,
  conversionRate?: number,
  decimals?: string | number,
) {
  if (!isValidPositiveNumericString(value)) {
    return undefined;
  }

  return trimTrailingZeros(
    removeAdditionalDecimalPlaces(
      new Numeric(value, 10).applyConversionRate(conversionRate).toString(),
      decimals,
    ) ?? '',
  );
}

export const navigateToSendRoute = (
  history: ReturnType<typeof useHistory>,
  isSendRedesignEnabled: boolean,
  params?: {
    address?: string;
    chainId?: string;
  },
) => {
  if (isSendRedesignEnabled) {
    if (params) {
      const queryParams = new URLSearchParams();
      const { address, chainId } = params;
      if (address) {
        queryParams.append('asset', address);
      }
      if (chainId) {
        queryParams.append('chainId', chainId);
      }
      history.push(`${SEND_ROUTE}/amount-recipient?${queryParams.toString()}`);
    } else {
      history.push(`${SEND_ROUTE}/asset`);
    }
  } else {
    history.push(SEND_ROUTE);
  }
};

export const getFractionLength = (value: string) => {
  const result = value.replace(/^-/u, '').split('.');
  const fracPart = result[1] ?? '';
  return fracPart.length;
};

export const addLeadingZeroIfNeeded = (value?: string) => {
  if (!value) {
    return value;
  }
  const result = value.replace(/^-/u, '').split('.');
  const wholePart = result[0];
  const fracPart = result[1] ?? '';
  if (!wholePart.length) {
    return `0.${fracPart}`;
  }
  return value;
};
