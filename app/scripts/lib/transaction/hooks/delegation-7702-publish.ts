import { Interface } from '@ethersproject/abi';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import {
  AuthorizationList,
  GasFeeToken,
  IsAtomicBatchSupportedRequest,
  IsAtomicBatchSupportedResult,
  PublishHook,
  PublishHookResult,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { Hex, createProjectLogger } from '@metamask/utils';
import {
  DeleGatorEnvironment,
  UnsignedDelegation,
  createCaveatBuilder,
  createDelegation,
  getDeleGatorEnvironment,
} from '../../../../../shared/lib/delegation';
import { exactExecution } from '../../../../../shared/lib/delegation/caveatBuilder/exactExecutionBuilder';
import { specificActionERC20TransferBatch } from '../../../../../shared/lib/delegation/caveatBuilder/specificActionERC20TransferBatchBuilder';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import { generateCalldata } from '../containers/enforced-simulations';
import { Caveat } from '../delegation';
import {
  RelayStatus,
  RelaySubmitRequest,
  submitRelayTransaction,
  waitForRelayResult,
} from '../transaction-relay';
import { BridgeStatusControllerGetStateAction } from '@metamask/bridge-status-controller';

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

    const atomicBatchChainSupport = atomicBatchSupport.find(
      (result) => result.chainId.toLowerCase() === chainId.toLowerCase(),
    );

    const isChainSupported =
      atomicBatchChainSupport &&
      (!atomicBatchChainSupport.delegationAddress ||
        atomicBatchChainSupport.isSupported);

    if (!isChainSupported) {
      log('Skipping as EIP-7702 is not supported', { from, chainId });
      return EMPTY_RESULT;
    }

    const { delegationAddress, upgradeContractAddress } =
      atomicBatchChainSupport;

    const isGasless7702Tx = await this.#isBridgeTxGasless7702(transactionMeta);

    if ((!selectedGasFeeToken || !gasFeeTokens?.length) && !isGasless7702Tx) {
      log('Skipping as no selected gas fee token');
      return EMPTY_RESULT;
    }

    const gasFeeToken = isGasless7702Tx
      ? undefined
      : gasFeeTokens?.find(
          (token) =>
            token.tokenAddress.toLowerCase() ===
            selectedGasFeeToken?.toLowerCase(),
        );

    if (!gasFeeToken && !isGasless7702Tx) {
      throw new Error('Selected gas fee token not found');
    }

    const delegationEnvironment = getDeleGatorEnvironment(
      Number(hexToDecimal(transactionMeta.chainId)),
    );
    const delegationManagerAddress = delegationEnvironment.DelegationManager;
    const includeTransfer = !isGasless7702Tx;
    const delegation = this.#buildUnsignedDelegation(
      delegationEnvironment,
      transactionMeta,
      gasFeeToken,
      includeTransfer,
    );

    log('Signing delegation');

    const delegationSignature = (await this.#messenger.call(
      'DelegationController:signDelegation',
      {
        chainId,
        delegation,
      },
    )) as Hex;

    log('Delegation signature', delegationSignature);

    const transactionData = generateCalldata({
      transaction: txParams,
      delegation: { ...delegation, signature: delegationSignature },
    });

    const relayRequest: RelaySubmitRequest = {
      chainId,
      data: transactionData,
      to: delegationManagerAddress,
    };

    if (!delegationAddress) {
      relayRequest.authorizationList = await this.#buildAuthorizationList(
        transactionMeta,
        upgradeContractAddress,
      );
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

  async #isBridgeTxGasless7702(
    transactionMeta: TransactionMeta,
  ): Promise<boolean> {
    try {
      const state = (await this.#messenger.call(
        'BridgeStatusController:getState',
      ));
      const gasIncluded7702 =
        state?.submissionRequests?.[transactionMeta.chainId]?.[transactionMeta.id]
          ?.quoteResponse?.quote?.gasIncluded7702;
      return Boolean(gasIncluded7702);
    } catch (error) {
      log(
        'Failed to determine whether the quoted transaction is intended to be gasless through EIP-7702',
        error,
      );
      return false;
    }
  }

  #buildUnsignedDelegation(
    environment: DeleGatorEnvironment,
    transactionMeta: TransactionMeta,
    gasFeeToken: GasFeeToken | undefined,
    includeTransfer: boolean,
  ): UnsignedDelegation {
    const caveats = this.#createCaveats(
      environment,
      transactionMeta,
      gasFeeToken,
      includeTransfer,
    );

    log('Caveats', caveats);

    const delegation = createDelegation({
      from: transactionMeta.txParams.from as Hex,
      to: transactionMeta.txParams.from as Hex,
      caveats,
    });

    log('Delegation', delegation);

    return delegation;
  }

  #createCaveats(
    environment: DeleGatorEnvironment,
    transactionMeta: TransactionMeta,
    gasFeeToken: GasFeeToken | undefined,
    includeTransfer: boolean,
  ): Caveat[] {
    const caveatBuilder = createCaveatBuilder(environment);

    const { txParams } = transactionMeta;
    const { data, to } = txParams;

    if (includeTransfer && gasFeeToken !== undefined) {
      const {
        tokenAddress: erc20TokenAddress,
        recipient: tokenTransferRecipientAddress,
        amount: transferAmount,
      } = gasFeeToken;
      const firstTxRecipientAddress = to as Hex;
      const firstTxCalldata = (data as Hex) ?? '0x';
      // TODO: should value be somehow equally passed here?

      caveatBuilder.addCaveat(
        specificActionERC20TransferBatch,
        erc20TokenAddress,
        tokenTransferRecipientAddress,
        BigInt(transferAmount),
        firstTxRecipientAddress,
        firstTxCalldata,
      );
    } else {
      const expectedExecution = (data as Hex) ?? '0x';
      // TODO: should value be somehow equally passed here?

      caveatBuilder.addCaveat(exactExecution, expectedExecution);
    }

    return caveatBuilder.build();
  }

  async #buildAuthorizationList(
    transactionMeta: TransactionMeta,
    upgradeContractAddress?: Hex,
  ): Promise<AuthorizationList> {
    const { chainId, txParams } = transactionMeta;
    const { from, nonce } = txParams;

    log('Including authorization as not upgraded');

    if (!upgradeContractAddress) {
      throw new Error('Upgrade contract address not found');
    }

    const authorizationSignature = (await this.#messenger.call(
      'KeyringController:signEip7702Authorization',
      {
        chainId: parseInt(chainId, 16),
        contractAddress: upgradeContractAddress,
        from,
        nonce: parseInt(nonce as string, 16),
      },
    )) as Hex;

    const { r, s, yParity } = this.#decodeAuthorizationSignature(
      authorizationSignature,
    );

    log('Authorization signature', { authorizationSignature, r, s, yParity });

    return [
      {
        address: upgradeContractAddress,
        chainId,
        nonce: nonce as Hex,
        r,
        s,
        yParity,
      },
    ];
  }

  #buildTokenTransferData(recipient: Hex, amount: Hex): Hex {
    return new Interface(abiERC20).encodeFunctionData('transfer', [
      recipient,
      amount,
    ]) as Hex;
  }

  #decodeAuthorizationSignature(signature: Hex) {
    const r = signature.slice(0, 66) as Hex;
    const s = `0x${signature.slice(66, 130)}` as Hex;
    const v = parseInt(signature.slice(130, 132), 16);
    const yParity = v - 27 === 0 ? ('0x' as const) : ('0x1' as const);

    return {
      r,
      s,
      yParity,
    };
  }
}
