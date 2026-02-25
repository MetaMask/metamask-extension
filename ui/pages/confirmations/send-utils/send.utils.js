import { encode } from '@metamask/abi-utils';
import { isHexString } from '@metamask/utils';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { addHexPrefix } from '../../../../app/scripts/lib/util';
import { Numeric } from '../../../../shared/modules/Numeric';
import { BURN_ADDRESS } from '../../../../shared/modules/hexstring-utils';
import {
  TOKEN_TRANSFER_FUNCTION_SIGNATURE,
  NFT_TRANSFER_FROM_FUNCTION_SIGNATURE,
  NFT_SAFE_TRANSFER_FROM_FUNCTION_SIGNATURE,
  TOKEN_APPROVAL_FUNCTION_SIGNATURE,
} from './send.constants';

export {
  generateERC20TransferData,
  generateERC20ApprovalData,
  generateERC721TransferData,
  generateERC1155TransferData,
  isBalanceSufficient,
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
  let balanceNumeric = new Numeric(balance, isHexString(balance) ? 16 : 10);

  if (typeof primaryCurrency !== 'undefined' && primaryCurrency !== null) {
    totalAmount = totalAmount.applyConversionRate(conversionRate);
    balanceNumeric = balanceNumeric.applyConversionRate(conversionRate);
  }

  return balanceNumeric.greaterThanOrEqualTo(totalAmount);
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

function generateERC20ApprovalData({
  spenderAddress = BURN_ADDRESS,
  amount = '0x0',
}) {
  if (!spenderAddress) {
    return undefined;
  }
  return (
    TOKEN_APPROVAL_FUNCTION_SIGNATURE +
    Array.prototype.map
      .call(
        encode(
          ['address', 'uint256'],
          [addHexPrefix(spenderAddress), addHexPrefix(amount)],
        ),
        (x) => `00${x.toString(16)}`.slice(-2),
      )
      .join('')
  );
}

function ellipsify(text, first = 6, last = 4) {
  if (!text) {
    return '';
  }

  return `${text.slice(0, first)}...${text.slice(-last)}`;
}
