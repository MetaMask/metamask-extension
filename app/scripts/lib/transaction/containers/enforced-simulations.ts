import {
  SimulationData,
  SimulationTokenStandard,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { Hex, createProjectLogger, hexToNumber } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import {
  createCaveatBuilder,
  getDeleGatorEnvironment,
  type DeleGatorEnvironment,
} from '../../../../../shared/lib/delegation';
import {
  type DelegationMessenger,
  convertTransactionToRedeemDelegations,
} from '../delegation';

const log = createProjectLogger('enforced-simulations');

const MOCK_DELEGATION_SIGNATURE =
  '0x2261a7810ed3e9cde160895909e138e2f68adb2da86fcf98ea0840701df107721fb369ab9b52550ea98832c09f8185284aca4c94bd345e867a4f4461868dd7751b' as Hex;

const DEFAULT_SLIPPAGE = 10;

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

  const caveats = generateCaveats(
    from,
    delegationEnvironment,
    simulationData,
    DEFAULT_SLIPPAGE,
  );

  const { data, to } = await convertTransactionToRedeemDelegations({
    transaction: transactionMeta,
    messenger: messenger as DelegationMessenger,
    caveats,
    delegatee: from,
    delegationSignature: useRealSignature
      ? undefined
      : MOCK_DELEGATION_SIGNATURE,
  });

  log('Data', data);

  return {
    updateTransaction: (transaction: TransactionMeta) => {
      transaction.txParams.data = data;
      transaction.txParams.to = to;
      transaction.txParams.value = '0x0';
    },
  };
}

function generateCaveats(
  recipient: Hex,
  environment: DeleGatorEnvironment,
  simulationData: SimulationData,
  slippage: number,
) {
  const caveatBuilder = createCaveatBuilder(environment);
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

    caveatBuilder.addCaveat(
      'nativeBalanceChange',
      enforceDecrease,
      recipient,
      delta,
    );
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
        caveatBuilder.addCaveat(
          'erc20BalanceChange',
          enforceDecrease,
          token,
          recipient,
          deltaWithSlippage,
        );
        break;

      case SimulationTokenStandard.erc721:
        caveatBuilder.addCaveat(
          'erc721BalanceChange',
          enforceDecrease,
          token,
          recipient,
          delta,
        );
        break;

      case SimulationTokenStandard.erc1155:
        caveatBuilder.addCaveat(
          'erc1155BalanceChange',
          enforceDecrease,
          token,
          recipient,
          tokenId,
          delta,
        );
        break;

      default:
        log('Unsupported token standard', standard);
        break;
    }
  }

  return caveatBuilder.build();
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
