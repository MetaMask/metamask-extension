import { Interface } from '@ethersproject/abi';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import {
  GasFeeToken,
  IsAtomicBatchSupportedRequest,
  IsAtomicBatchSupportedResult,
  PublishHook,
  PublishHookResult,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { Hex, createProjectLogger } from '@metamask/utils';
import {
  Caveat,
  ExecutionStruct,
  createCaveatBuilder,
  getDeleGatorEnvironment,
} from '../../../../../shared/lib/delegation';
import {
  findAtomicBatchSupportForChain,
  checkEip7702Support,
} from '../../../../../shared/lib/eip7702-support-utils';
import { limitedCalls } from '../../../../../shared/lib/delegation/caveatBuilder/limitedCallsBuilder';
import { specificActionERC20TransferBatch } from '../../../../../shared/lib/delegation/caveatBuilder/specificActionERC20TransferBatchBuilder';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import {
  RelayStatus,
  RelaySubmitRequest,
  submitRelayTransaction,
  waitForRelayResult,
} from '../transaction-relay';
import {
  getClientForTransactionMetadata,
  sanitizeOrigin,
} from '../../smart-transaction/utils';
import {
  type DelegationMessenger,
  convertTransactionToRedeemDelegations,
  normalizeCallData,
} from '../delegation';

const POLLING_INTERVAL_MS = 1000; // 1 Second

const EMPTY_RESULT = {
  transactionHash: undefined,
};

const log = createProjectLogger('delegation-7702-publish-hook');

export class Delegation7702PublishHook {
  #isAtomicBatchSupported: (
    request: IsAtomicBatchSupportedRequest,
  ) => Promise<IsAtomicBatchSupportedResult>;

  #messenger: TransactionControllerInitMessenger;

  constructor({
    isAtomicBatchSupported,
    messenger,
  }: {
    isAtomicBatchSupported: (
      request: IsAtomicBatchSupportedRequest,
    ) => Promise<IsAtomicBatchSupportedResult>;
    messenger: TransactionControllerInitMessenger;
  }) {
    this.#isAtomicBatchSupported = isAtomicBatchSupported;
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
    const { chainId, gasFeeTokens, selectedGasFeeToken, txParams } =
      transactionMeta;

    const { from } = txParams;

    const atomicBatchSupport = await this.#isAtomicBatchSupported({
      address: from as Hex,
      chainIds: [chainId],
    });

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

    const delegationEnvironment = getDeleGatorEnvironment(
      parseInt(transactionMeta.chainId, 16),
    );
    const delegationManagerAddress = delegationEnvironment.DelegationManager;
    const includeTransfer =
      !isGaslessSwap && !transactionMeta.isGasFeeSponsored;

    if (includeTransfer && (!gasFeeToken || gasFeeToken === undefined)) {
      throw new Error('Gas fee token not found');
    }

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

    const transferOverrides =
      includeTransfer && gasFeeToken
        ? {
            caveats: this.#buildTransferCaveats(
              delegationEnvironment,
              finalTransactionMeta,
              gasFeeToken,
            ),
            additionalExecutions: [this.#buildTransferExecution(gasFeeToken)],
          }
        : {};

    const { data, authorizationList } =
      await convertTransactionToRedeemDelegations({
        transaction: finalTransactionMeta,
        messenger: this.#messenger as DelegationMessenger,
        ...transferOverrides,
        authorization: delegationAddress
          ? undefined
          : {
              upgradeContractAddress:
                (upgradeContractAddress as Hex) ?? undefined,
            },
      });

    const relayRequest: RelaySubmitRequest = {
      chainId,
      data,
      to: delegationManagerAddress,
      metadata: {
        txType: transactionMeta.type,
        client: getClientForTransactionMetadata(),
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

  #buildTransferExecution(
    gasFeeToken: GasFeeToken | undefined,
  ): ExecutionStruct {
    if (!gasFeeToken) {
      throw new Error('Selected gas fee token not found');
    }

    return {
      target: gasFeeToken.tokenAddress,
      value: BigInt('0x0'),
      callData: this.#buildTokenTransferData(
        gasFeeToken.recipient,
        gasFeeToken.amount,
      ),
    };
  }

  #buildTransferCaveats(
    environment: ReturnType<typeof getDeleGatorEnvironment>,
    transactionMeta: TransactionMeta,
    gasFeeToken: GasFeeToken,
  ): Caveat[] {
    const caveatBuilder = createCaveatBuilder(environment);

    const { txParams } = transactionMeta;
    const { to, value, data } = txParams;
    const { tokenAddress, recipient, amount } = gasFeeToken;

    if (to !== undefined) {
      caveatBuilder.addCaveat(
        specificActionERC20TransferBatch,
        tokenAddress,
        recipient,
        amount,
        to,
        (value as Hex) ?? '0x0',
        normalizeCallData(data),
      );
    }

    caveatBuilder.addCaveat(limitedCalls, 1);

    return caveatBuilder.build();
  }

  #buildTokenTransferData(recipient: Hex, amount: Hex): Hex {
    return new Interface(abiERC20).encodeFunctionData('transfer', [
      recipient,
      amount,
    ]) as Hex;
  }
}
