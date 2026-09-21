import { Interface } from '@ethersproject/abi';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import {
  GasFeeToken,
  PublishHook,
  PublishHookResult,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex, createProjectLogger } from '@metamask/utils';
import { ExecutionStruct } from '../../../../../shared/lib/delegation';
import {
  findAtomicBatchSupportForChain,
  checkEip7702Support,
} from '../../../../../shared/lib/eip7702-support-utils';
import { TransactionControllerInitMessenger } from '../../../wallet-init/messengers/transaction-controller-messenger';
import {
  RelayStatus,
  RelaySubmitRequest,
  submitRelayTransaction,
  waitForRelayResult,
} from '../transaction-relay';
import {
  getClientForTransactionMetadata,
  getClientVersionForTransactionMetadata,
  sanitizeOrigin,
} from '../../smart-transaction/utils';
import {
  type DelegationMessenger,
  convertTransactionToRedeemDelegations,
} from '../delegation';

const POLLING_INTERVAL_MS = 1000; // 1 Second

const EMPTY_RESULT = {
  transactionHash: undefined,
};

type RelayTransactionTxType = NonNullable<
  RelaySubmitRequest['metadata']
>['txType'];

const log = createProjectLogger('delegation-7702-publish-hook');

export class Delegation7702PublishHook {
  #messenger: TransactionControllerInitMessenger;

  constructor({
    messenger,
  }: {
    messenger: TransactionControllerInitMessenger;
  }) {
    this.#messenger = messenger;
  }

  getHook(): PublishHook {
    return this.#hookWrapper.bind(this);
  }

  async #hookWrapper(
    transactionMeta: TransactionMeta,
    _signedTx: string,
  ): Promise<PublishHookResult> {
    try {
      return await this.#hook(transactionMeta, _signedTx);
    } catch (error) {
      log('Error', error);
      throw error;
    }
  }

  async #hook(
    transactionMeta: TransactionMeta,
    _signedTx: string,
  ): Promise<PublishHookResult> {
    if (transactionMeta.type === TransactionType.revokeDelegation) {
      log('Skipping: revokeDelegation must publish as top-level setCode');
      return EMPTY_RESULT;
    }

    const { chainId, gasFeeTokens, selectedGasFeeToken, txParams } =
      transactionMeta;

    const { from } = txParams;

    const atomicBatchSupport = await this.#messenger.call(
      'TransactionController:isAtomicBatchSupported',
      {
        address: from as Hex,
        chainIds: [chainId],
      },
    );

    const atomicBatchChainSupport = findAtomicBatchSupportForChain(
      atomicBatchSupport,
      chainId,
    );

    const { isSupported, delegationAddress, upgradeContractAddress } =
      checkEip7702Support(atomicBatchChainSupport);

    const { isGasFeeIncluded } = transactionMeta;

    const isSponsored = Boolean(transactionMeta.isGasFeeSponsored);

    if (!isSupported) {
      log('Skipping as EIP-7702 is not supported', { from, chainId });

      if (isGasFeeIncluded || isSponsored) {
        // Same as mobile: sponsored and gas-included transactions skip local
        // signing, so falling through to the default publish would raw-send
        // an unsigned payload ("Transaction decoding error"). Fail loudly.
        throw new Error(
          `Chain must support EIP-7702 for sponsored or gas included transaction. chainId: ${chainId}, delegationAddress: ${
            atomicBatchChainSupport?.delegationAddress ?? 'none'
          }, upgradeContractAddress: ${
            atomicBatchChainSupport?.upgradeContractAddress ?? 'none'
          }, entryFound: ${Boolean(atomicBatchChainSupport)}`,
        );
      }

      return EMPTY_RESULT;
    }

    if (
      (!selectedGasFeeToken || !gasFeeTokens?.length) &&
      !isGasFeeIncluded &&
      !isSponsored
    ) {
      log('Skipping as no selected gas fee token');
      return EMPTY_RESULT;
    }

    const gasFeeToken =
      isGasFeeIncluded || isSponsored
        ? undefined
        : gasFeeTokens?.find(
            (token) =>
              token.tokenAddress.toLowerCase() ===
              selectedGasFeeToken?.toLowerCase(),
          );

    if (!gasFeeToken && !isGasFeeIncluded && !isSponsored) {
      throw new Error('Selected gas fee token not found');
    }

    const includeTransfer =
      !isGasFeeIncluded && !transactionMeta.isGasFeeSponsored;

    const { nonce, ...txParamsWithoutNonce } = transactionMeta.txParams;
    const finalTransactionMeta: TransactionMeta = {
      ...transactionMeta,
      txParams: txParamsWithoutNonce,
    };

    if (transactionMeta.txParams.nonce !== undefined) {
      await this.#messenger.call(
        'TransactionController:updateTransaction',
        finalTransactionMeta,
        'Remove nonce for EIP-7702 delegation transaction',
      );
    }

    const additionalExecutions =
      includeTransfer && gasFeeToken
        ? [this.#buildTransferExecution(gasFeeToken)]
        : [];

    const { data, to, authorizationList } =
      await convertTransactionToRedeemDelegations({
        transaction: finalTransactionMeta,
        messenger: this.#messenger as DelegationMessenger,
        additionalExecutions,
        authorization: delegationAddress
          ? undefined
          : {
              upgradeContractAddress:
                (upgradeContractAddress as Hex) ?? undefined,
            },
        // Same as mobile's publish hook: relay the parent `execute()` as a
        // single execution. Expanding `nestedTransactions` into a batch
        // redeem is a shape mobile never publishes — on Monad it mined
        // without moving funds for Money Account withdrawals.
        useParentExecution: true,
      });

    const relayRequest: RelaySubmitRequest = {
      chainId,
      data,
      to,
      metadata: {
        txType: transactionMeta.type as RelayTransactionTxType,
        client: getClientForTransactionMetadata(),
        clientVersion: getClientVersionForTransactionMetadata(),
        origin: sanitizeOrigin(transactionMeta.origin),
      },
    };

    if (authorizationList) {
      relayRequest.authorizationList = authorizationList;
    }

    log('Relay request', relayRequest);

    const { uuid } = await submitRelayTransaction(relayRequest);

    const { transactionHash, status } = await waitForRelayResult({
      chainId,
      uuid,
      interval: POLLING_INTERVAL_MS,
    });

    if (status !== RelayStatus.Success) {
      throw new Error(`Transaction relay error - ${status}`);
    }

    return {
      transactionHash,
    };
  }

  #buildTransferExecution(gasFeeToken: GasFeeToken): ExecutionStruct {
    return {
      target: gasFeeToken.tokenAddress,
      value: BigInt('0x0'),
      callData: new Interface(abiERC20).encodeFunctionData('transfer', [
        gasFeeToken.recipient,
        gasFeeToken.amount,
      ]) as Hex,
    };
  }
}
