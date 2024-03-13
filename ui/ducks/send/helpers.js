import { addHexPrefix } from 'ethereumjs-util';
import abi from 'human-standard-token-abi';
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import {
  AssetType,
  TokenStandard,
} from '../../../shared/constants/transaction';
import {
  generateERC20TransferData,
  generateERC721TransferData,
  generateERC1155TransferData,
} from '../../pages/confirmations/send/send.utils';

/**
 * Generates a txParams from the send slice.
 *
 * @param {import('.').SendState} sendState - the state of the send slice
 * @returns {import('@metamask/transaction-controller').TransactionParams} A txParams object that can be used to create a transaction or
 *  update an existing transaction.
 */
export function generateTransactionParams(sendState) {
  const draftTransaction =
    sendState.draftTransactions[sendState.currentTransactionUUID];

  const txParams = {
    // If the fromAccount has been specified we use that, if not we use the
    // selected account.
    from:
      draftTransaction.fromAccount?.address ||
      sendState.selectedAccount.address,
  };

  switch (draftTransaction.asset.type) {
    case AssetType.token:
      // When sending a token the to address is the contract address of
      // the token being sent. The value is set to '0x0' and the data
      // is generated from the recipient address, token being sent and
      // amount.
      txParams.to = draftTransaction.asset.details.address;
      txParams.value = '0x0';
      txParams.data = generateERC20TransferData({
        toAddress: draftTransaction.recipient.address,
        amount: draftTransaction.amount.value,
        sendToken: draftTransaction.asset.details,
      });
      break;

    case AssetType.NFT:
      // When sending a token the to address is the contract address of
      // the token being sent. The value is set to '0x0' and the data
      // is generated from the recipient address, token being sent and
      // amount.
      txParams.to = draftTransaction.asset.details.address;
      txParams.value = '0x0';
      txParams.data =
        draftTransaction.asset.details?.standard === TokenStandard.ERC721
          ? generateERC721TransferData({
              toAddress: draftTransaction.recipient.address,
              fromAddress:
                draftTransaction.fromAccount?.address ??
                sendState.selectedAccount.address,
              tokenId: draftTransaction.asset.details.tokenId,
            })
          : generateERC1155TransferData({
              toAddress: draftTransaction.recipient.address,
              fromAddress:
                draftTransaction.fromAccount?.address ??
                sendState.selectedAccount.address,
              tokenId: draftTransaction.asset.details.tokenId,
              amount: draftTransaction.amount.value,
            });
      break;
    case AssetType.native:
    default:
      // When sending native currency the to and value fields use the
      // recipient and amount values and the data key is either null or
      // populated with the user input provided in hex field.
      txParams.to = draftTransaction.recipient.address;
      txParams.value = draftTransaction.amount.value;
      txParams.data = draftTransaction.userInputHexData ?? undefined;
  }

  // We need to make sure that we only include the right gas fee fields
  // based on the type of transaction the network supports. We will also set
  // the type param here.
  if (sendState.eip1559support) {
    txParams.type = TransactionEnvelopeType.feeMarket;
  } else {
    txParams.type = TransactionEnvelopeType.legacy;
  }

  return txParams;
}

export async function getERC20Balance(token, accountAddress) {
  const contract = global.eth.contract(abi).at(token.address);
  const usersToken = (await contract.balanceOf(accountAddress)) ?? null;
  if (!usersToken) {
    return '0x0';
  }
  const amount = calcTokenAmount(
    usersToken.balance.toString(),
    token.decimals,
  ).toString(16);
  return addHexPrefix(amount);
}
