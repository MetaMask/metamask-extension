import {
  AuthorizationList,
  GasFeeToken,
  IsAtomicBatchSupportedRequest,
  IsAtomicBatchSupportedResult,
  PublishHook,
  PublishHookResult,
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import { Hex, add0x, createProjectLogger, remove0x } from '@metamask/utils';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import { Interface } from '@ethersproject/abi';
import {
  ANY_BENEFICIARY,
  Caveat,
  Delegation,
  Execution,
  ExecutionMode,
  ROOT_AUTHORITY,
  UnsignedDelegation,
  encodeRedeemDelegations,
  signDelegation,
} from '../delegation';
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

    if (!selectedGasFeeToken || !gasFeeTokens?.length) {
      log('Skipping as no selected gas fee token');
      return EMPTY_RESULT;
    }

    const gasFeeToken = gasFeeTokens.find(
      (token) =>
        token.tokenAddress.toLowerCase() === selectedGasFeeToken.toLowerCase(),
    );

    if (!gasFeeToken) {
      throw new Error('Selected gas fee token not found');
    }

    const delegation = await this.#buildDelegation(
      transactionMeta,
      gasFeeToken,
    );

    const executions = this.#buildExecutions(transactionMeta, gasFeeToken);

    const transactionData = encodeRedeemDelegations(
      [[delegation]],
      [ExecutionMode.BATCH_DEFAULT_MODE],
      [executions],
    );

    const relayRequest: RelaySubmitRequest = {
      chainId,
      data: transactionData,
      to: process.env.DELEGATION_MANAGER_ADDRESS as Hex,
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

  #buildExecutions(
    transactionMeta: TransactionMeta,
    gasFeeToken: GasFeeToken,
  ): Execution[] {
    const { txParams } = transactionMeta;
    const { data, to, value } = txParams;

    const userExecution: Execution = {
      target: to as Hex,
      value: (value as Hex) ?? '0x0',
      callData: (data as Hex) ?? EMPTY_HEX,
    };

    const transferExecution: Execution = {
      target: gasFeeToken.tokenAddress,
      value: '0x0',
      callData: this.#buildTokenTransferData(
        gasFeeToken.recipient,
        gasFeeToken.amount,
      ),
    };

    return [userExecution, transferExecution];
  }

  async #buildDelegation(
    transactionMeta: TransactionMeta,
    gasFeeToken: GasFeeToken,
  ): Promise<Delegation> {
    const { chainId, txParams } = transactionMeta;
    const { from } = txParams;

    const caveats = this.#buildCaveats(txParams, gasFeeToken);

    log('Caveats', caveats);

    const delegation: UnsignedDelegation = {
      authority: ROOT_AUTHORITY,
      caveats,
      delegate: ANY_BENEFICIARY,
      delegator: from as Hex,
      salt: new Date().getTime(),
    };

    log('Unsigned delegation', delegation);

    const signature = await signDelegation({
      chainId,
      delegation,
      from: from as Hex,
      messenger: this.#messenger,
    });

    log('Delegation signature', signature);

    return {
      ...delegation,
      signature,
    };
  }

  #buildCaveats(
    txParams: TransactionParams,
    gasFeeToken: GasFeeToken,
  ): Caveat[] {
    const { amount, recipient, tokenAddress } = gasFeeToken;
    const { data, to } = txParams;
    const tokenAmountPadded = add0x(remove0x(amount).padStart(64, '0'));
    const enforcer = process.env.GASLESS_7702_ENFORCER_ADDRESS as Hex;

    const enforcerTerms = add0x(
      (
        [
          tokenAddress,
          recipient,
          tokenAmountPadded,
          to,
          data ?? EMPTY_HEX,
        ] as Hex[]
      )
        .map(remove0x)
        .join(''),
    );

    return [
      {
        enforcer,
        terms: enforcerTerms,
        args: EMPTY_HEX,
      },
    ];
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
