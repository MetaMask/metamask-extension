import abi from 'ethereumjs-abi';
import {
  addCurrencies,
  conversionUtil,
  conversionGTE,
  multiplyCurrencies,
  conversionGreaterThan,
  conversionLessThan,
} from '../../../shared/modules/conversion.utils';

import { addHexPrefix } from '../../../app/scripts/lib/util';
import { ERC20, ERC721 } from '../../../shared/constants/transaction';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import {
  TOKEN_TRANSFER_FUNCTION_SIGNATURE,
  COLLECTIBLE_TRANSFER_FROM_FUNCTION_SIGNATURE,
} from './send.constants';

export {
  addGasBuffer,
  getAssetTransferData,
  generateERC20TransferData,
  generateERC721TransferData,
  isBalanceSufficient,
  isTokenBalanceSufficient,
  ellipsify,
};

function isBalanceSufficient({
  amount = '0x0',
  balance = '0x0',
  conversionRate = 1,
  gasTotal = '0x0',
  primaryCurrency,
}) {
  const totalAmount = addCurrencies(amount, gasTotal, {
    aBase: 16,
    bBase: 16,
    toNumericBase: 'hex',
  });

  const balanceIsSufficient = conversionGTE(
    {
      value: balance,
      fromNumericBase: 'hex',
      fromCurrency: primaryCurrency,
      conversionRate,
    },
    {
      value: totalAmount,
      fromNumericBase: 'hex',
      conversionRate,
      fromCurrency: primaryCurrency,
    },
  );

  return balanceIsSufficient;
}

function isTokenBalanceSufficient({ amount = '0x0', tokenBalance, decimals }) {
  const amountInDec = conversionUtil(amount, {
    fromNumericBase: 'hex',
  });

  const tokenBalanceIsSufficient = conversionGTE(
    {
      value: tokenBalance,
      fromNumericBase: 'hex',
    },
    {
      value: calcTokenAmount(amountInDec, decimals),
    },
  );

  return tokenBalanceIsSufficient;
}

function addGasBuffer(
  initialGasLimitHex,
  blockGasLimitHex,
  bufferMultiplier = 1.5,
) {
  const upperGasLimit = multiplyCurrencies(blockGasLimitHex, 0.9, {
    toNumericBase: 'hex',
    multiplicandBase: 16,
    multiplierBase: 10,
    numberOfDecimals: '0',
  });
  const bufferedGasLimit = multiplyCurrencies(
    initialGasLimitHex,
    bufferMultiplier,
    {
      toNumericBase: 'hex',
      multiplicandBase: 16,
      multiplierBase: 10,
      numberOfDecimals: '0',
    },
  );

  // if initialGasLimit is above blockGasLimit, dont modify it
  if (
    conversionGreaterThan(
      { value: initialGasLimitHex, fromNumericBase: 'hex' },
      { value: upperGasLimit, fromNumericBase: 'hex' },
    )
  ) {
    return initialGasLimitHex;
  }
  // if bufferedGasLimit is below blockGasLimit, use bufferedGasLimit
  if (
    conversionLessThan(
      { value: bufferedGasLimit, fromNumericBase: 'hex' },
      { value: upperGasLimit, fromNumericBase: 'hex' },
    )
  ) {
    return bufferedGasLimit;
  }
  // otherwise use blockGasLimit
  return upperGasLimit;
}

function generateERC20TransferData({
  toAddress = '0x0',
  amount = '0x0',
  sendToken,
}) {
  if (!sendToken) {
    return undefined;
  }
  return (
    TOKEN_TRANSFER_FUNCTION_SIGNATURE +
    Array.prototype.map
      .call(
        abi.rawEncode(
          ['address', 'uint256'],
          [addHexPrefix(toAddress), addHexPrefix(amount)],
        ),
        (x) => `00${x.toString(16)}`.slice(-2),
      )
      .join('')
  );
}

function generateERC721TransferData({
  toAddress = '0x0',
  fromAddress = '0x0',
  tokenId,
}) {
  if (!tokenId) {
    return undefined;
  }
  return (
    COLLECTIBLE_TRANSFER_FROM_FUNCTION_SIGNATURE +
    Array.prototype.map
      .call(
        abi.rawEncode(
          ['address', 'address', 'uint256'],
          [addHexPrefix(fromAddress), addHexPrefix(toAddress), tokenId],
        ),
        (x) => `00${x.toString(16)}`.slice(-2),
      )
      .join('')
  );
}

function getAssetTransferData({ sendToken, fromAddress, toAddress, amount }) {
  switch (sendToken.standard) {
    case ERC721:
      return generateERC721TransferData({
        toAddress,
        fromAddress,
        tokenId: sendToken.tokenId,
      });
    case ERC20:
    default:
      return generateERC20TransferData({
        toAddress,
        amount,
        sendToken,
      });
  }
}

function ellipsify(text, first = 6, last = 4) {
  if (!text) {
    return '';
  }

  return `${text.slice(0, first)}...${text.slice(-last)}`;
}
