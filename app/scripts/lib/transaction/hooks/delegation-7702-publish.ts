import { Interface } from '@ethersproject/abi';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import {
  GasFeeToken,
  PublishHook,
  PublishHookResult,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { Hex, createProjectLogger } from '@metamask/utils';
import { ExecutionStruct } from '../../../../../shared/lib/delegation';
import {
  GAS_SPONSORSHIP_BUFFER_BPS,
  GAS_SPONSORSHIP_CAMPAIGN_ID,
  GAS_SPONSORSHIP_VAULT_ABI,
  GAS_SPONSORSHIP_VAULT_ADDRESS_BASE,
} from '../../../../../shared/constants/gas-sponsorship';
import {
  checkEip7702Support,
  findAtomicBatchSupportForChain,
} from '../../../../../shared/lib/eip7702-support-utils';
import { TransactionControllerInitMessenger } from '../../../messenger-client-init/messengers/transaction-controller-messenger';
import { estimateGasSponsorshipAmount } from '../gas-sponsorship-estimator';
import {
  type DelegationMessenger,
  convertTransactionToRedeemDelegations,
} from '../delegation';
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

const POLLING_INTERVAL_MS = 1000; // 1 Second
const SPONSORSHIP_VAULT_INTERFACE = new Interface(GAS_SPONSORSHIP_VAULT_ABI);

const EMPTY_RESULT = {
  transactionHash: undefined,
};

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
      this.#debugError('Hook failed', error, {
        chainId: transactionMeta.chainId,
        networkClientId: transactionMeta.networkClientId,
        transactionId: transactionMeta.id,
        transactionType: transactionMeta.type,
      });
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

    this.#debug('Hook start', {
      chainId,
      from,
      hasGasFeeTokens: Boolean(gasFeeTokens?.length),
      isExternalSign: Boolean(transactionMeta.isExternalSign),
      isGasFeeIncluded: Boolean(transactionMeta.isGasFeeIncluded),
      isGasFeeSponsored: Boolean(transactionMeta.isGasFeeSponsored),
      networkClientId: transactionMeta.networkClientId,
      selectedGasFeeToken,
      transactionId: transactionMeta.id,
      transactionType: transactionMeta.type,
    });

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

    this.#debug('EIP-7702 support result', {
      chainId,
      delegationAddress,
      isSupported,
      upgradeContractAddress,
    });

    if (!isSupported) {
      log('Skipping as EIP-7702 is not supported', { from, chainId });
      return EMPTY_RESULT;
    }

    const isGaslessSwap = Boolean(transactionMeta.isGasFeeIncluded);

    // Campaign sponsorship is only supported for the 7702 external-sign flow.
    const isSponsored =
      Boolean(transactionMeta.isGasFeeSponsored) &&
      Boolean(transactionMeta.isExternalSign);

    if (
      (!selectedGasFeeToken || !gasFeeTokens?.length) &&
      !isGaslessSwap &&
      !isSponsored
    ) {
      this.#debug(
        'Skipping delegation publish: no gas fee token and not sponsored',
        {
          chainId,
          isGaslessSwap,
          isSponsored,
          selectedGasFeeToken,
        },
      );
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

    const includeTransfer = !isGaslessSwap && !isSponsored;

    this.#debug('Execution mode gating', {
      includeTransfer,
      isExternalSign: Boolean(transactionMeta.isExternalSign),
      isGaslessSwap,
      isSponsored,
      selectedGasFeeToken,
    });

    if (includeTransfer && !gasFeeToken) {
      throw new Error('Gas fee token not found');
    }

    const { nonce, ...txParamsWithoutNonce } = transactionMeta.txParams;
    const finalTransactionMeta: TransactionMeta = {
      ...transactionMeta,
      txParams: txParamsWithoutNonce,
    };

    const sponsorshipAmountWei = isSponsored
      ? await this.#estimateSponsorshipAmount(finalTransactionMeta)
      : undefined;

    this.#debug('Sponsorship estimation result', {
      isSponsored,
      sponsorshipAmountWei: sponsorshipAmountWei?.toString(),
      transactionId: transactionMeta.id,
    });

    if (transactionMeta.txParams.nonce !== undefined) {
      await this.#messenger.call(
        'TransactionController:updateTransaction',
        finalTransactionMeta,
        'Remove nonce for EIP-7702 delegation transaction',
      );
    }

    const additionalExecutions: ExecutionStruct[] = [];

    if (includeTransfer && gasFeeToken) {
      additionalExecutions.push(this.#buildTransferExecution(gasFeeToken));
    }

    if (sponsorshipAmountWei !== undefined) {
      this.#debug('Building sponsored execution batch', {
        sponsorshipAmountWei: sponsorshipAmountWei.toString(),
        transactionId: transactionMeta.id,
      });
      additionalExecutions.push(
        this.#buildSponsoredSettlementExecution(sponsorshipAmountWei),
      );
    }

    this.#debug('Built additional executions', {
      count: additionalExecutions.length,
      targets: additionalExecutions.map((execution) => execution.target),
      transactionId: transactionMeta.id,
    });

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

    const relayRequest: RelaySubmitRequest = {
      chainId,
      data,
      to,
      metadata: {
        txType: transactionMeta.type,
        client: getClientForTransactionMetadata(),
        origin: sanitizeOrigin(transactionMeta.origin),
      },
    };

    if (authorizationList) {
      relayRequest.authorizationList = authorizationList;
    }

    this.#debug('Submitting relay request', {
      chainId,
      hasAuthorizationList: Boolean(relayRequest.authorizationList?.length),
      to: relayRequest.to,
      transactionId: transactionMeta.id,
    });
    log('Relay request', relayRequest);

    const { uuid } = await submitRelayTransaction(relayRequest);

    this.#debug('Relay accepted', {
      chainId,
      transactionId: transactionMeta.id,
      uuid,
    });

    const { transactionHash, status } = await waitForRelayResult({
      chainId,
      uuid,
      interval: POLLING_INTERVAL_MS,
    });

    this.#debug('Relay result', {
      status,
      transactionHash,
      transactionId: transactionMeta.id,
      uuid,
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
      value: 0n,
      callData: new Interface(abiERC20).encodeFunctionData('transfer', [
        gasFeeToken.recipient,
        gasFeeToken.amount,
      ]) as Hex,
    };
  }

  #buildSponsoredSettlementExecution(amountWei: bigint): ExecutionStruct {
    return {
      target: GAS_SPONSORSHIP_VAULT_ADDRESS_BASE,
      value: 0n,
      callData: SPONSORSHIP_VAULT_INTERFACE.encodeFunctionData(
        'settleCampaignGas',
        [GAS_SPONSORSHIP_CAMPAIGN_ID, amountWei],
      ) as Hex,
    };
  }

  async #estimateSponsorshipAmount(transactionMeta: TransactionMeta) {
    const { networkClientId, txParams } = transactionMeta;

    if (!networkClientId) {
      throw new Error(
        'Gas sponsorship estimation failed: missing networkClientId',
      );
    }

    try {
      this.#debug('Estimating sponsorship amount', {
        campaignId: GAS_SPONSORSHIP_CAMPAIGN_ID,
        networkClientId,
        transactionId: transactionMeta.id,
        txGas: txParams.gas,
        txGasLimit: txParams.gasLimit,
        txGasPrice: txParams.gasPrice,
        txMaxFeePerGas: txParams.maxFeePerGas,
      });

      const { amountWei, diagnostics } = await estimateGasSponsorshipAmount({
        bufferBps: GAS_SPONSORSHIP_BUFFER_BPS,
        campaignId: GAS_SPONSORSHIP_CAMPAIGN_ID,
        vaultAddress: GAS_SPONSORSHIP_VAULT_ADDRESS_BASE,
        networkClientId,
        txParams,
        getNetworkClientById: (id) =>
          this.#messenger.call('NetworkController:getNetworkClientById', id),
      });

      this.#debug('Sponsorship amount estimated', {
        diagnostics,
        transactionId: transactionMeta.id,
      });

      if (amountWei <= 0n) {
        throw new Error('computed sponsorship amount is invalid');
      }

      return amountWei;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      this.#debugError('Sponsorship estimation failed', error, {
        networkClientId,
        transactionId: transactionMeta.id,
      });
      throw new Error(`Gas sponsorship estimation failed: ${reason}`);
    }
  }

  #debug(message: string, details?: Record<string, unknown>) {
    // eslint-disable-next-line no-console
    console.log('delegation-7702-publish-hook:', message, details ?? {});
  }

  #debugError(
    message: string,
    error: unknown,
    details?: Record<string, unknown>,
  ) {
    const normalizedError =
      error instanceof Error
        ? {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack,
          }
        : { errorValue: error };

    // eslint-disable-next-line no-console
    console.error('delegation-7702-publish-hook:', message, {
      ...normalizedError,
      ...(details ?? {}),
    });
  }
}
