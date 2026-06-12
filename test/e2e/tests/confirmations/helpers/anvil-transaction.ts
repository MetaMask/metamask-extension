import { Anvil } from '../../../seeder/anvil';

type PublicClient = ReturnType<Anvil['getProvider']>['publicClient'];

export async function getTransactionDetails(
  anvil: Anvil,
  txHash: `0x${string}`,
) {
  const { publicClient } = anvil.getProvider();
  const tx = await publicClient.getTransaction({ hash: txHash });
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

  const revertReason =
    receipt.status === 'reverted'
      ? await getRevertReason(publicClient, txHash)
      : undefined;

  return { tx, receipt, revertReason };
}

async function getRevertReason(
  publicClient: PublicClient,
  txHash: `0x${string}`,
): Promise<string | undefined> {
  try {
    const trace = (await publicClient.transport.request({
      method: 'debug_traceTransaction',
      params: [
        txHash,
        { tracer: 'callTracer', tracerConfig: { withLog: true } },
      ],
    })) as { revertReason?: string };
    return trace?.revertReason;
  } catch {
    return undefined;
  }
}
