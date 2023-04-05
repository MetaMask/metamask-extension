import abi from 'ethereumjs-abi';

import { addHexPrefix } from '../../../app/scripts/lib/util';
import { TokenStandard } from '../../../shared/constants/transaction';
import { Numeric } from '../../../shared/modules/Numeric';
import {
  TOKEN_TRANSFER_FUNCTION_SIGNATURE,
  NFT_TRANSFER_FROM_FUNCTION_SIGNATURE,
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
  let totalAmount = new Numeric(amount, 16).add(new Numeric(gasTotal, 16));
  let balanceNumeric = new Numeric(balance, 16);

  if (typeof primaryCurrency !== 'undefined' && primaryCurrency !== null) {
    totalAmount = totalAmount.applyConversionRate(conversionRate);
    balanceNumeric = balanceNumeric.applyConversionRate(conversionRate);
  }

  return balanceNumeric.greaterThanOrEqualTo(totalAmount);
}

function isTokenBalanceSufficient({ amount = '0x0', tokenBalance, decimals }) {
  const amountNumeric = new Numeric(amount, 16).shiftedBy(decimals);
  const tokenBalanceNumeric = new Numeric(tokenBalance, 16);

  return tokenBalanceNumeric.greaterThanOrEqualTo(amountNumeric);
}

function addGasBuffer(
  initialGasLimitHex,
  blockGasLimitHex,
  bufferMultiplier = 1.5,
) {
  const initialGasLimit = new Numeric(initialGasLimitHex, 16);
  const upperGasLimit = new Numeric(blockGasLimitHex, 16)
    .times(new Numeric(0.9, 10))
    .round(0);

  const bufferedGasLimit = initialGasLimit
    .times(new Numeric(bufferMultiplier, 10))
    .round(0);

  // if initialGasLimit is above blockGasLimit, dont modify it
  if (initialGasLimit.greaterThanOrEqualTo(upperGasLimit)) {
    return initialGasLimitHex;
  }
  // if bufferedGasLimit is below blockGasLimit, use bufferedGasLimit
  if (bufferedGasLimit.lessThan(upperGasLimit)) {
    return bufferedGasLimit.toString();
  }
  // otherwise use blockGasLimit
  return upperGasLimit.toString();
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
    NFT_TRANSFER_FROM_FUNCTION_SIGNATURE +
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
    case TokenStandard.ERC721:
      return generateERC721TransferData({
        toAddress,
        fromAddress,
        tokenId: sendToken.tokenId,
      });
    case TokenStandard.ERC20:
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
