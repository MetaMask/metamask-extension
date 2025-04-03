import {
  GasFeeToken,
  PublishHook,
  PublishHookResult,
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import { Hex, add0x, createProjectLogger, remove0x } from '@metamask/utils';
import {
  ADDRESS_DELEGATION_MANAGER,
  ANY_BENEFICIARY,
  Caveat,
  Execution,
  ExecutionMode,
  ROOT_AUTHORITY,
  UnsignedDelegation,
  encodeRedeemDelegations,
  signDelegation,
} from '../delegation';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import { Interface } from '@ethersproject/abi';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import { RelaySubmitRequest, submitRelayTransaction } from '../transaction-relay';

const ENFORCER_ADDRESS = process.env.GASLESS_7702_ENFORCER_ADDRESS as Hex;
const EMPTY_HEX = '0x';

const EMPTY_RESULT = {
  transactionHash: undefined,
};

const log = createProjectLogger('delegation-7702-publish-hook');

export class Delegation7702PublishHook {
  #isEIP7702Supported: (account: Hex, chainId: Hex) => Promise<boolean>;

  #messenger: TransactionControllerInitMessenger;

  constructor({
    isEIP7702Supported,
    messenger,
  }: {
    isEIP7702Supported: (account: Hex, chainId: Hex) => Promise<boolean>;
    messenger: TransactionControllerInitMessenger;
  }) {
    this.#isEIP7702Supported = isEIP7702Supported;
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

    const { data, from, maxFeePerGas, maxPriorityFeePerGas, to, value } =
      txParams;

    const isEIP7702Supported = await this.#isEIP7702Supported(
      from as Hex,
      chainId,
    );

    if (!isEIP7702Supported) {
      log('Skipping as EIP-7702 is not supported', { from, chainId });
      return EMPTY_RESULT;
    }

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

    const transactionData = encodeRedeemDelegations(
      [[{ ...delegation, signature }]],
      [ExecutionMode.BATCH_DEFAULT_MODE],
      [[userExecution, transferExecution]],
    );

    const transactionParams: RelaySubmitRequest = {
      data: transactionData,
      maxFeePerGas: maxFeePerGas as Hex,
      maxPriorityFeePerGas: maxPriorityFeePerGas as Hex,
      to: ADDRESS_DELEGATION_MANAGER,
    };

    log('Transaction params', transactionParams);

    const { transactionHash } = await submitRelayTransaction(transactionParams);

    return {
      transactionHash,
    };
  }

  #buildCaveats(
    txParams: TransactionParams,
    gasFeeToken: GasFeeToken,
  ): Caveat[] {
    const { amount, recipient, tokenAddress } = gasFeeToken;
    const { data, to } = txParams;
    const tokenAmountPadded = add0x(remove0x(amount).padStart(64, '0'));

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
        enforcer: ENFORCER_ADDRESS,
        terms: enforcerTerms,
        args: EMPTY_HEX,
      },
    ];
  }

  #buildTokenTransferData(recipient: Hex, amount: Hex): Hex {
    return new Interface(abiERC20).encodeFunctionData('transfer', [
      recipient,
      amount,
    ]) as Hex;
  }
}
