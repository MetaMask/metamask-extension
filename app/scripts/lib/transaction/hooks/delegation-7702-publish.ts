import { Interface } from '@ethersproject/abi';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import {
  SentinelSmartTransactionStatus,
  type SentinelRelaySubmitRequest,
} from '@metamask-previews/sentinel-api-service';
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
  type SentinelRelayMessenger,
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
  SentinelRelaySubmitRequest['metadata']
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

    if (!isSupported) {
      log('Skipping as EIP-7702 is not supported', { from, chainId });
      return EMPTY_RESULT;
    }

    const isGaslessSwap = transactionMeta.isGasFeeIncluded;

    const isSponsored = Boolean(transactionMeta.isGasFeeSponsored);

    if (
      (!selectedGasFeeToken || !gasFeeTokens?.length) &&
      !isGaslessSwap &&
      !isSponsored
    ) {
      log('Skipping as no selected gas fee token');
      return EMPTY_RESULT;
    }

    const gasFeeToken =
      isGaslessSwap || isSponsored
        ? undefined
        : gasFeeTokens?.find(
            (token) =>
              token.tokenAddress.toLowerCase() ===
              selectedGasFeeToken?.toLowerCase(),
          );

    if (!gasFeeToken && !isGaslessSwap && !isSponsored) {
      throw new Error('Selected gas fee token not found');
    }

    const includeTransfer =
      !isGaslessSwap && !transactionMeta.isGasFeeSponsored;

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
      });

    const relayRequest: SentinelRelaySubmitRequest = {
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
      relayRequest.authorizationList = authorizationList.map((auth) => ({
        address: auth.address,
        chainId: auth.chainId as Hex,
        nonce: auth.nonce as Hex,
        r: auth.r as Hex,
        s: auth.s as Hex,
        yParity: auth.yParity as Hex,
      }));
    }

    log('Relay request', relayRequest);

    // The restricted init messenger structurally satisfies the relay actions
    // but its broad `call` overload union is not directly assignable to the
    // narrower relay messenger type, so narrow it here.
    const relayMessenger = this.#messenger as unknown as SentinelRelayMessenger;

    const { uuid } = await submitRelayTransaction(relayMessenger, relayRequest);

    const { hash, status } = await waitForRelayResult(relayMessenger, {
      chainId,
      uuid,
      interval: POLLING_INTERVAL_MS,
    });

    if (status !== SentinelSmartTransactionStatus.Validated) {
      throw new Error(`Transaction relay error - ${status}`);
    }

    return {
      transactionHash: hash as Hex,
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
