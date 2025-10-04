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
  BATCH_DEFAULT_MODE,
  Caveat,
  DeleGatorEnvironment,
  ExecutionMode,
  ExecutionStruct,
  SINGLE_DEFAULT_MODE,
  UnsignedDelegation,
  createCaveatBuilder,
  createDelegation,
  getDeleGatorEnvironment,
} from '../../../../../shared/lib/delegation';
import { exactExecution } from '../../../../../shared/lib/delegation/caveatBuilder/exactExecutionBuilder';
import { limitedCalls } from '../../../../../shared/lib/delegation/caveatBuilder/limitedCallsBuilder';
import { specificActionERC20TransferBatch } from '../../../../../shared/lib/delegation/caveatBuilder/specificActionERC20TransferBatchBuilder';
import type { Delegation } from '../../../../../shared/lib/delegation/delegation';
import {
  ANY_BENEFICIARY,
  encodeRedeemDelegations,
} from '../../../../../shared/lib/delegation/delegation';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import {
  RelayStatus,
  RelaySubmitRequest,
  submitRelayTransaction,
  waitForRelayResult,
} from '../transaction-relay';

const EMPTY_HEX = '0x';
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

    const isGaslessSwap = transactionMeta.isGasFeeIncluded;

    if ((!selectedGasFeeToken || !gasFeeTokens?.length) && !isGaslessSwap) {
      log('Skipping as no selected gas fee token');
      return EMPTY_RESULT;
    }

    const gasFeeToken = isGaslessSwap
      ? undefined
      : gasFeeTokens?.find(
          (token) =>
            token.tokenAddress.toLowerCase() ===
            selectedGasFeeToken?.toLowerCase(),
        );

    if (!gasFeeToken && !isGaslessSwap) {
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

    const delegations = await this.#buildDelegation(
      delegationEnvironment,
      transactionMeta,
      gasFeeToken,
      includeTransfer,
    );

    const modes: ExecutionMode[] = [
      includeTransfer ? BATCH_DEFAULT_MODE : SINGLE_DEFAULT_MODE,
    ];
    const executions = this.#buildExecutions(
      transactionMeta,
      gasFeeToken,
      includeTransfer,
    );

    const transactionData = encodeRedeemDelegations({
      delegations,
      modes,
      executions,
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

  async #buildDelegation(
    delegationEnvironment: DeleGatorEnvironment,
    transactionMeta: TransactionMeta,
    gasFeeToken: GasFeeToken | undefined,
    includeTransfer: boolean,
  ): Promise<Delegation[][]> {
    const unsignedDelegation = this.#buildUnsignedDelegation(
      delegationEnvironment,
      transactionMeta,
      gasFeeToken,
      includeTransfer,
    );

    log('Signing delegation');

    const delegationSignature = (await this.#messenger.call(
      'DelegationController:signDelegation',
      {
        chainId: transactionMeta.chainId,
        delegation: unsignedDelegation,
      },
    )) as Hex;

    log('Delegation signature', delegationSignature);

    const delegations: Delegation[][] = [
      [
        {
          ...unsignedDelegation,
          signature: delegationSignature,
        },
      ],
    ];

    return delegations;
  }

  #buildExecutions(
    transactionMeta: TransactionMeta,
    gasFeeToken: GasFeeToken | undefined,
    includeTransfer: boolean,
  ): ExecutionStruct[][] {
    const { txParams } = transactionMeta;
    const { data, to, value } = txParams;
    const userExecution: ExecutionStruct = {
      target: to as Hex,
      value: BigInt((value as Hex) ?? '0x0'),
      callData: (data as Hex) ?? EMPTY_HEX,
    };

    if (!includeTransfer) {
      return [[userExecution]];
    }

    if (!gasFeeToken) {
      throw new Error('Selected gas fee token not found');
    }

    const transferExecution: ExecutionStruct = {
      target: gasFeeToken.tokenAddress,
      value: BigInt('0x0'),
      callData: this.#buildTokenTransferData(
        gasFeeToken.recipient,
        gasFeeToken.amount,
      ),
    };
    return [[userExecution, transferExecution]];
  }

  #buildUnsignedDelegation(
    environment: DeleGatorEnvironment,
    transactionMeta: TransactionMeta,
    gasFeeToken: GasFeeToken | undefined,
    includeTransfer: boolean,
  ): UnsignedDelegation {
    const caveats = this.#buildCaveats(
      environment,
      transactionMeta,
      gasFeeToken,
      includeTransfer,
    );

    log('Caveats', caveats);

    const delegation = createDelegation({
      from: transactionMeta.txParams.from as Hex,
      to: ANY_BENEFICIARY,
      caveats,
    });

    log('Delegation', delegation);

    return delegation;
  }

  #buildCaveats(
    environment: DeleGatorEnvironment,
    transactionMeta: TransactionMeta,
    gasFeeToken: GasFeeToken | undefined,
    includeTransfer: boolean,
  ): Caveat[] {
    const caveatBuilder = createCaveatBuilder(environment);

    const { txParams } = transactionMeta;
    const { to, value, data } = txParams;

    if (includeTransfer && gasFeeToken !== undefined) {
      const { tokenAddress, recipient, amount } = gasFeeToken;

      // contract deployments can't be delegated
      if (to !== undefined) {
        caveatBuilder.addCaveat(
          specificActionERC20TransferBatch,
          tokenAddress,
          recipient,
          amount,
          to,
          (value as Hex) ?? '0x0',
          data,
        );
      }
    } else if (to !== undefined) {
      // contract deployments can't be delegated
      caveatBuilder.addCaveat(exactExecution, to, value ?? '0x0', data ?? '0x');
    }

    // the relay may only execute this delegation once for security reasons
    caveatBuilder.addCaveat(limitedCalls, 1);

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
