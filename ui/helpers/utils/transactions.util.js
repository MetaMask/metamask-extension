import { MethodRegistry } from 'eth-method-registry';
import log from 'loglevel';
import { ERC1155, ERC721 } from '@metamask/controller-utils';

import {
  TransactionEnvelopeType,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { addHexPrefix } from '../../../app/scripts/lib/util';
import { TransactionGroupStatus } from '../../../shared/constants/transaction';
import { readAddressAsContract } from '../../../shared/modules/contract-utils';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';

/**
 * @typedef EthersContractCall
 * @type object
 * @property {any[]} args - The args/params to the function call.
 * An array-like object with numerical and string indices.
 * @property {string} name - The name of the function.
 * @property {string} signature - The function signature.
 * @property {string} sighash - The function signature hash.
 * @property {EthersBigNumber} value - The ETH value associated with the call.
 * @property {FunctionFragment} functionFragment - The Ethers function fragment
 * representation of the function.
 */

async function getMethodFrom4Byte(fourBytePrefix) {
  const fourByteResponse = await fetchWithCache({
    url: `https://www.4byte.directory/api/v1/signatures/?hex_signature=${fourBytePrefix}`,
    fetchOptions: {
      referrerPolicy: 'no-referrer-when-downgrade',
      body: null,
      method: 'GET',
      mode: 'cors',
    },
    functionName: 'getMethodFrom4Byte',
  });
  fourByteResponse.results.sort((a, b) => {
    return new Date(a.created_at).getTime() < new Date(b.created_at).getTime()
      ? -1
      : 1;
  });
  return fourByteResponse.results[0].text_signature;
}

let registry;

/**
 * Attempts to return the method data from the MethodRegistry library, the message registry library and the token abi, in that order of preference
 *
 * @param {string} fourBytePrefix - The prefix from the method code associated with the data
 * @param {boolean} allow4ByteRequests - Whether or not to allow 4byte.directory requests, toggled by the user in privacy settings
 * @returns {object}
 */
export async function getMethodDataAsync(fourBytePrefix, allow4ByteRequests) {
  try {
    let fourByteSig = null;
    if (allow4ByteRequests) {
      fourByteSig = await getMethodFrom4Byte(fourBytePrefix).catch((e) => {
        log.error(e);
        return null;
      });
    }

    if (!registry) {
      registry = new MethodRegistry({ provider: global.ethereumProvider });
    }

    if (!fourByteSig) {
      return {};
    }

    const parsedResult = registry.parse(fourByteSig);

    return {
      name: parsedResult.name,
      params: parsedResult.args,
    };
  } catch (error) {
    log.error(error);
    return {};
  }
}

/**
 * Returns four-byte method signature from data
 *
 * @param {string} data - The hex data (@code txParams.data) of a transaction
 * @returns {string} The four-byte method signature
 */
export function getFourBytePrefix(data = '') {
  const prefixedData = addHexPrefix(data);
  const fourBytePrefix = prefixedData.slice(0, 10);
  return fourBytePrefix;
}

/**
 * Given an transaction category, returns a boolean which indicates whether the transaction is calling an erc20 token method
 *
 * @param {TRANSACTION_TYPES[keyof TRANSACTION_TYPES]} type - The type of transaction being evaluated
 * @returns {boolean} whether the transaction is calling an erc20 token method
 */
export function isTokenMethodAction(type) {
  return [
    TransactionType.tokenMethodTransfer,
    TransactionType.tokenMethodApprove,
    TransactionType.tokenMethodSetApprovalForAll,
    TransactionType.tokenMethodTransferFrom,
    TransactionType.tokenMethodSafeTransferFrom,
  ].includes(type);
}

export function getLatestSubmittedTxWithNonce(
  transactions = [],
  nonce = '0x0',
) {
  if (!transactions.length) {
    return {};
  }

  return transactions.reduce((acc, current) => {
    const { submittedTime, txParams: { nonce: currentNonce } = {} } = current;

    if (currentNonce === nonce) {
      if (!acc.submittedTime) {
        return current;
      }
      return submittedTime > acc.submittedTime ? current : acc;
    }
    return acc;
  }, {});
}

export async function isSmartContractAddress(address) {
  const { isContractAddress } = await readAddressAsContract(
    global.eth,
    address,
  );
  return isContractAddress;
}

export function isLegacyTransaction(txParams) {
  return txParams?.type === TransactionEnvelopeType.legacy;
}

/**
 * Returns a status key for a transaction. Requires parsing the txMeta.txReceipt on top of
 * txMeta.status because txMeta.status does not reflect on-chain errors.
 *
 * @param {object} transaction - The txMeta object of a transaction.
 * @param {object} transaction.txReceipt - The transaction receipt.
 * @returns {string}
 */
export function getStatusKey(transaction) {
  const {
    txReceipt: { status: receiptStatus } = {},
    type,
    status,
  } = transaction;

  // There was an on-chain failure
  if (receiptStatus === '0x0') {
    return TransactionStatus.failed;
  }

  if (
    status === TransactionStatus.confirmed &&
    type === TransactionType.cancel
  ) {
    return TransactionGroupStatus.cancelled;
  }

  return transaction.status;
}

/**
 * Returns a title for the given transaction category.
 *
 * This will throw an error if the transaction category is unrecognized and no default is provided.
 *
 * @param {Function} t - The translation function
 * @param {TRANSACTION_TYPES[keyof TRANSACTION_TYPES]} type - The transaction type constant
 * @param {string} nativeCurrency - The native currency of the currently selected network
 * @returns {string} The transaction category title
 */
export function getTransactionTypeTitle(t, type, nativeCurrency = 'ETH') {
  switch (type) {
    case TransactionType.tokenMethodTransfer: {
      return t('transfer');
    }
    case TransactionType.tokenMethodTransferFrom: {
      return t('transferFrom');
    }
    case TransactionType.tokenMethodSafeTransferFrom: {
      return t('safeTransferFrom');
    }
    case TransactionType.tokenMethodApprove: {
      return t('approve');
    }
    case TransactionType.tokenMethodSetApprovalForAll: {
      return t('setApprovalForAll');
    }
    case TransactionType.simpleSend: {
      return t('sendingNativeAsset', [nativeCurrency]);
    }
    case TransactionType.contractInteraction: {
      return t('contractInteraction');
    }
    case TransactionType.deployContract: {
      return t('contractDeployment');
    }
    case TransactionType.swap: {
      return t('swap');
    }
    case TransactionType.swapApproval: {
      return t('swapApproval');
    }
    default: {
      throw new Error(`Unrecognized transaction type: ${type}`);
    }
  }
}

/**
 * Method to check if asset standard passed is NFT
 *
 * @param {*} assetStandard - string
 * @returns boolean
 */
export const isNFTAssetStandard = (assetStandard) =>
  assetStandard === ERC1155 || assetStandard === ERC721;
