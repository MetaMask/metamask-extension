import {
  SimulationData,
  SimulationTokenStandard,
  TransactionMeta,
} from '@metamask/transaction-controller';
import {
  Hex,
  bytesToHex,
  concatBytes,
  createProjectLogger,
  hexToBytes,
  hexToNumber,
} from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import {
  createERC1155BalanceChangeTerms,
  createERC20BalanceChangeTerms,
  createERC721BalanceChangeTerms,
  createNativeBalanceChangeTerms,
  BalanceChangeType,
} from '@metamask/delegation-core';
import { TransactionControllerInitMessenger } from '../../../wallet-init/messengers/transaction-controller-messenger';
import { getEnforcedSimulationsSlippage } from '../../../../../shared/lib/transaction/enforced-simulations';
import {
  getDeleGatorEnvironment,
  type Caveat,
  type DeleGatorEnvironment,
} from '../../../../../shared/lib/delegation';
import {
  type DelegationMessenger,
  convertTransactionToRedeemDelegations,
} from '../delegation';

const log = createProjectLogger('enforced-simulations');
const args: Hex = '0x';

const MOCK_DELEGATION_SIGNATURE =
  '0x2261a7810ed3e9cde160895909e138e2f68adb2da86fcf98ea0840701df107721fb369ab9b52550ea98832c09f8185284aca4c94bd345e867a4f4461868dd7751b' as Hex;

export async function enforceSimulations({
  messenger,
  transactionMeta,
  useRealSignature = false,
}: {
  messenger: TransactionControllerInitMessenger;
  transactionMeta: TransactionMeta;
  useRealSignature?: boolean;
}) {
  log('Enforcing simulations', {
    transactionMeta,
    useRealSignature,
  });

  const {
    chainId,
    simulationData = { tokenBalanceChanges: [] },
    txParams,
  } = transactionMeta;

  const from = txParams.from as Hex;
  const chainIdDecimal = hexToNumber(chainId);
  const delegationEnvironment = getDeleGatorEnvironment(chainIdDecimal);

  const remoteFeatureFlagState = messenger.call(
    'RemoteFeatureFlagController:getState',
  );
  const slippage = getEnforcedSimulationsSlippage(remoteFeatureFlagState);

  const caveats = generateCaveats(
    from,
    delegationEnvironment,
    simulationData,
    slippage,
  );

  const { authorizationList, data, to, type } =
    await convertTransactionToRedeemDelegations({
      transaction: transactionMeta,
      messenger: messenger as DelegationMessenger,
      caveats,
      delegatee: from,
      delegationSignature: useRealSignature
        ? undefined
        : MOCK_DELEGATION_SIGNATURE,
      authorization: transactionMeta.delegationAddress
        ? undefined
        : { minimal: true },
    });

  log('Data', data);

  return {
    slippage,
    updateTransaction: (transaction: TransactionMeta) => {
      transaction.txParams.data = data;
      transaction.txParams.to = to;
      transaction.txParams.value = '0x0';
      transaction.txParams.type = type;

      if (authorizationList) {
        transaction.txParams.authorizationList = authorizationList;
      }
    },
  };
}

function generateCaveats(
  recipient: Hex,
  environment: DeleGatorEnvironment,
  simulationData: SimulationData,
  slippage: number,
) {
  const caveats: Caveat[] = [];

  const { nativeBalanceChange, tokenBalanceChanges = [] } = simulationData;

  if (nativeBalanceChange) {
    const {
      difference,
      isDecrease: enforceDecrease,
      previousBalance,
    } = nativeBalanceChange;
    const delta = applySlippage(
      difference,
      slippage,
      enforceDecrease,
      previousBalance,
    );

    log('Caveat - Native Balance Change', {
      enforceDecrease,
      recipient,
      delta: BigInt(difference),
      slippage,
      deltaWithSlippage: delta,
    });

    caveats.push({
      enforcer: environment.caveatEnforcers.NativeBalanceChangeEnforcer,
      terms: createNativeBalanceChangeTerms({
        recipient,
        balance: delta,
        changeType: getBalanceChangeType(enforceDecrease),
      }),
      args,
    });
  } else {
    log('Caveat - Native Balance Change - Enforce No Decrease', { recipient });

    caveats.push({
      enforcer: environment.caveatEnforcers.NativeBalanceChangeEnforcer,
      // Enforce that the native balance does not decrease at all (zero
      // tolerance). The `NativeBalanceChangeEnforcer` contract checks
      // `after >= before - amount`, so an amount of `0` requires
      // `after >= before`. We encode the 53-byte terms directly because
      // `createNativeBalanceChangeTerms` rejects a zero balance, even though
      // the on-chain enforcer accepts it.
      terms: createNoNativeBalanceDecreaseTerms(recipient),
      args,
    });
  }

  for (const tokenChange of tokenBalanceChanges) {
    const {
      difference,
      isDecrease: enforceDecrease,
      address: token,
      standard,
      id: tokenIdHex,
      previousBalance,
    } = tokenChange;

    const delta = BigInt(difference);

    const deltaWithSlippage = applySlippage(
      difference,
      slippage,
      enforceDecrease,
      previousBalance,
    );

    const tokenId = tokenIdHex ? BigInt(tokenIdHex) : 0n;

    log('Caveat - Token Balance Change', {
      enforceDecrease,
      token,
      recipient,
      delta,
      slippage,
      deltaWithSlippage,
    });

    switch (standard) {
      case SimulationTokenStandard.erc20:
        caveats.push({
          enforcer: environment.caveatEnforcers.ERC20BalanceChangeEnforcer,
          terms: createERC20BalanceChangeTerms({
            tokenAddress: token,
            recipient,
            balance: deltaWithSlippage,
            changeType: getBalanceChangeType(enforceDecrease),
          }),
          args,
        });

        break;

      case SimulationTokenStandard.erc721:
        caveats.push({
          enforcer: environment.caveatEnforcers.ERC721BalanceChangeEnforcer,
          terms: createERC721BalanceChangeTerms({
            tokenAddress: token,
            recipient,
            amount: delta,
            changeType: getBalanceChangeType(enforceDecrease),
          }),
          args,
        });
        break;

      case SimulationTokenStandard.erc1155:
        caveats.push({
          enforcer: environment.caveatEnforcers.ERC1155BalanceChangeEnforcer,
          terms: createERC1155BalanceChangeTerms({
            tokenAddress: token,
            recipient,
            tokenId,
            balance: delta,
            changeType: getBalanceChangeType(enforceDecrease),
          }),
          args,
        });
        break;

      default:
        log('Unsupported token standard', standard);
        break;
    }
  }

  // Defensive invariant — unreachable since a native caveat is always emitted above
  if (caveats.length === 0) {
    throw new Error('No caveats generated for enforced simulations');
  }

  return caveats;
}

/**
 * Encodes `NativeBalanceChangeEnforcer` terms that forbid any decrease in the
 * recipient's native balance.
 *
 * The terms are 53 packed bytes (per the on-chain enforcer):
 * byte 0 is the `enforceDecrease` flag (`0x01` = decrease), bytes 1-20 are the
 * recipient address, and bytes 21-52 are the guardrail amount (here `0`, so the
 * balance must not decrease at all: `after >= before - 0`).
 *
 * We encode these terms directly rather than via
 * `createNativeBalanceChangeTerms` because that helper rejects a zero balance,
 * even though the on-chain enforcer treats a zero amount as valid.
 *
 * @param recipient - The address whose native balance must not decrease.
 * @returns The 53-byte hex-encoded enforcer terms.
 */
function createNoNativeBalanceDecreaseTerms(recipient: Hex): Hex {
  const enforceDecreaseByte = new Uint8Array([1]);
  const recipientBytes = hexToBytes(recipient);
  const amountBytes = new Uint8Array(32);

  return bytesToHex(
    concatBytes([enforceDecreaseByte, recipientBytes, amountBytes]),
  );
}

function getBalanceChangeType(enforceDecrease: boolean): BalanceChangeType {
  return enforceDecrease
    ? BalanceChangeType.Decrease
    : BalanceChangeType.Increase;
}

function applySlippage(
  value: Hex,
  slippage: number,
  isDecrease: boolean,
  previousBalance: Hex,
): bigint {
  const valueBN = new BigNumber(value);
  const slippageMultiplier = (100 + (isDecrease ? slippage : -slippage)) / 100;
  const valueWithSlippage = BigInt(valueBN.mul(slippageMultiplier).toFixed(0));

  if (!isDecrease) {
    return valueWithSlippage;
  }

  const maximumDecrease = BigInt(previousBalance);
  return valueWithSlippage > maximumDecrease
    ? maximumDecrease
    : valueWithSlippage;
}
