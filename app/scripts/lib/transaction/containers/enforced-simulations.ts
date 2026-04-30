import {
  SimulationData,
  SimulationTokenStandard,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { Hex, createProjectLogger, hexToNumber } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import {
  createERC1155BalanceChangeTerms,
  createERC20BalanceChangeTerms,
  createERC721BalanceChangeTerms,
  createNativeBalanceChangeTerms,
} from '@metamask/delegation-core';
import { TransactionControllerInitMessenger } from '../../../messenger-client-init/messengers/transaction-controller-messenger';
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
  const slippage = getEnforcedSimulationsSlippage();

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
    const { difference, isDecrease: enforceDecrease } = nativeBalanceChange;
    const delta = applySlippage(difference, slippage, enforceDecrease);

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
  }

  for (const tokenChange of tokenBalanceChanges) {
    const {
      difference,
      isDecrease: enforceDecrease,
      address: token,
      standard,
      id: tokenIdHex,
    } = tokenChange;

    const delta = BigInt(difference);

    const deltaWithSlippage = applySlippage(
      difference,
      slippage,
      enforceDecrease,
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

  if (caveats.length === 0) {
    throw new Error('No caveats generated for enforced simulations');
  }

  return caveats;
}

enum BalanceChangeType {
  INCREASE = 0,
  DECREASE = 1,
}

function getBalanceChangeType(enforceDecrease: boolean): BalanceChangeType {
  return enforceDecrease
    ? BalanceChangeType.DECREASE
    : BalanceChangeType.INCREASE;
}

function applySlippage(
  value: Hex,
  slippage: number,
  isDecrease: boolean,
): bigint {
  const valueBN = new BigNumber(value);
  const slippageMultiplier = (100 + (isDecrease ? slippage : -slippage)) / 100;
  return BigInt(valueBN.mul(slippageMultiplier).toFixed(0));
}
