import { encode } from '@metamask/abi-utils';

import { addHexPrefix } from '../../../../app/scripts/lib/util';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { Numeric } from '../../../../shared/modules/Numeric';
import {
  TOKEN_TRANSFER_FUNCTION_SIGNATURE,
  NFT_TRANSFER_FROM_FUNCTION_SIGNATURE,
  NFT_SAFE_TRANSFER_FROM_FUNCTION_SIGNATURE,
} from './send.constants';
import { MAX_SYMBOL_DISPLAY_LENGTH } from '../../../../shared/constants/tokens';

export {
  addGasBuffer,
  getAssetTransferData,
  generateERC20TransferData,
  generateERC721TransferData,
  generateERC1155TransferData,
  isBalanceSufficient,
  isTokenBalanceSufficient,
  isERC1155BalanceSufficient,
  ellipsify,
};

function isBalanceSufficient({
  amount = '0x0',
  balance = '0x0',
  conversionRate = 1,
  gasTotal = '0x0',
  primaryCurrency = undefined,
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

function isERC1155BalanceSufficient({ amount = '0', tokenBalance }) {
  const amountNumeric = new Numeric(amount, 16);
  const tokenBalanceNumeric = new Numeric(tokenBalance, 10);

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
        encode(
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
        encode(
          ['address', 'address', 'uint256'],
          [addHexPrefix(fromAddress), addHexPrefix(toAddress), BigInt(tokenId)],
        ),
        (x) => `00${x.toString(16)}`.slice(-2),
      )
      .join('')
  );
}

function generateERC1155TransferData({
  toAddress = '0x0',
  fromAddress = '0x0',
  tokenId,
  amount = '1',
  data = '0',
}) {
  if (!tokenId) {
    return undefined;
  }
  return (
    NFT_SAFE_TRANSFER_FROM_FUNCTION_SIGNATURE +
    Array.prototype.map
      .call(
        encode(
          ['address', 'address', 'uint256', 'uint256', 'bytes'],
          [
            addHexPrefix(fromAddress),
            addHexPrefix(toAddress),
            BigInt(tokenId),
            addHexPrefix(amount),
            addHexPrefix(data),
          ],
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
    case TokenStandard.ERC1155:
      return generateERC1155TransferData({
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

/**
 * Truncates a given string to a specified length by displaying start and end parts with ellipsis ('...').
 *  Returns full string if under ELLIPSIFY_LENGTH.
 * @param {Token Name or Symbol} text - The input string to be truncated.
 * @param {number} first - The number of characters to display at the beginning of the string (default is 6).
 * @param {number} last - The number of characters to display at the end of the string (default is 4).
 * @returns {string} A truncated version of the input string.
 */
function ellipsify(text, first = 6, last = 4) {
  if (!text) {
    return '';
  }

  return (
    text.length < MAX_SYMBOL_DISPLAY_LENGTH) ?
    text :
    `${text.slice(0, first)}...${text.slice(-last)}`;
}
