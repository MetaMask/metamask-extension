import { Interface } from '@ethersproject/abi';
import type { NetworkClientId } from '@metamask/network-controller';
import type { TransactionParams } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { GAS_SPONSORSHIP_VAULT_ABI } from '../../../../shared/constants/gas-sponsorship';

const BPS_DENOMINATOR = 10_000n;
const SETTLE_ESTIMATION_AMOUNT_WEI = 1n;

const SPONSORSHIP_VAULT_INTERFACE = new Interface(GAS_SPONSORSHIP_VAULT_ABI);

export type GasSponsorshipEstimationDiagnostics = {
  amountWei: string;
  bufferedBps: number;
  maxFeePerGasWei: string;
  settlementEscrowAddress: string;
  settleTxFrom: string;
  settleTxCostWei: string;
  settleTxGasLimit: string;
  txFrom: string | undefined;
  userTxCostWei: string;
  userTxGasLimit: string;
};

export type GasSponsorshipEstimationResult = {
  amountWei: bigint;
  diagnostics: GasSponsorshipEstimationDiagnostics;
};

type NetworkClientProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const parseQuantity = (
  value: unknown,
  fieldName: string,
  { allowZero = false }: { allowZero?: boolean } = {},
) => {
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${fieldName}: expected hex quantity string`);
  }

  let parsed: bigint;
  try {
    parsed = BigInt(value);
  } catch {
    throw new Error(`Invalid ${fieldName}: expected hex quantity string`);
  }

  if (!allowZero && parsed <= 0n) {
    throw new Error(`Invalid ${fieldName}: expected positive quantity`);
  }

  return parsed;
};

const applyBpsBuffer = (value: bigint, bufferBps: number) => {
  const numerator = value * (BPS_DENOMINATOR + BigInt(bufferBps));
  return (numerator + (BPS_DENOMINATOR - 1n)) / BPS_DENOMINATOR;
};

const estimateSettleGasLimit = async ({
  campaignId,
  vaultAddress,
  provider,
  settleTxFrom,
}: {
  campaignId: Hex;
  vaultAddress: Hex;
  provider: NetworkClientProvider;
  settleTxFrom: string;
}) => {
  const settlementEscrowCallData =
    SPONSORSHIP_VAULT_INTERFACE.encodeFunctionData('settlementEscrow');
  const escrowResult = (await provider.request({
    method: 'eth_call',
    params: [
      {
        to: vaultAddress,
        data: settlementEscrowCallData,
      },
      'latest',
    ],
  })) as string;

  const [settlementEscrowAddress] =
    SPONSORSHIP_VAULT_INTERFACE.decodeFunctionResult(
      'settlementEscrow',
      escrowResult,
    );

  const settleCallData = SPONSORSHIP_VAULT_INTERFACE.encodeFunctionData(
    'settleCampaignGas',
    [campaignId, SETTLE_ESTIMATION_AMOUNT_WEI],
  );

  const settleGasLimitResult = await provider.request({
    method: 'eth_estimateGas',
    params: [
      {
        from: settleTxFrom,
        to: vaultAddress,
        data: settleCallData,
      },
    ],
  });

  return {
    settleTxGasLimit: parseQuantity(settleGasLimitResult, 'settleTxGasLimit'),
    settlementEscrowAddress,
    settleTxFrom,
  };
};

export async function estimateGasSponsorshipAmount({
  bufferBps,
  campaignId,
  vaultAddress,
  networkClientId,
  txParams,
  getNetworkClientById,
}: {
  bufferBps: number;
  campaignId: Hex;
  vaultAddress: Hex;
  networkClientId: NetworkClientId;
  txParams: TransactionParams;
  getNetworkClientById: (networkClientId: NetworkClientId) => {
    provider: NetworkClientProvider;
  };
}): Promise<GasSponsorshipEstimationResult> {
  const userTxGasLimit = parseQuantity(
    txParams.gas ?? txParams.gasLimit,
    'userTxGasLimit',
  );
  const maxFeePerGasWei = parseQuantity(
    txParams.maxFeePerGas ?? txParams.gasPrice,
    'maxFeePerGas',
  );
  if (!txParams.from) {
    throw new Error('Invalid txFrom: expected address string');
  }

  const networkClient = getNetworkClientById(networkClientId);
  const { settleTxGasLimit, settlementEscrowAddress, settleTxFrom } =
    await estimateSettleGasLimit({
      campaignId,
      vaultAddress,
      provider: networkClient.provider,
      settleTxFrom: txParams.from,
    });

  const userTxCostWei = userTxGasLimit * maxFeePerGasWei;
  const settleTxCostWei = settleTxGasLimit * maxFeePerGasWei;
  const amountWei = applyBpsBuffer(userTxCostWei + settleTxCostWei, bufferBps);

  return {
    amountWei,
    diagnostics: {
      amountWei: amountWei.toString(),
      bufferedBps: bufferBps,
      maxFeePerGasWei: maxFeePerGasWei.toString(),
      settlementEscrowAddress,
      settleTxFrom,
      settleTxCostWei: settleTxCostWei.toString(),
      settleTxGasLimit: settleTxGasLimit.toString(),
      txFrom: txParams.from,
      userTxCostWei: userTxCostWei.toString(),
      userTxGasLimit: userTxGasLimit.toString(),
    },
  };
}
