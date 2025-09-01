import { MessageParamsTypedData } from '@metamask/signature-controller';
import type { Json } from '@metamask/utils';
import { SignTypedDataVersion } from '@metamask/keyring-controller';
import type { Hex } from '@metamask/utils';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import { TransactionControllerInitMessenger } from '../../controller-init/messengers/transaction-controller-messenger';

const TYPES_EIP_712_DOMAIN: Array<{ name: string; type: string }> = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

const TYPES_COW_ORDER: Record<string, unknown> = {
  EIP712Domain: TYPES_EIP_712_DOMAIN,
  Order: [
    { name: 'sellToken', type: 'address' },
    { name: 'buyToken', type: 'address' },
    { name: 'receiver', type: 'address' },
    { name: 'sellAmount', type: 'uint256' },
    { name: 'buyAmount', type: 'uint256' },
    { name: 'validTo', type: 'uint32' },
    { name: 'appData', type: 'bytes32' },
    { name: 'feeAmount', type: 'uint256' },
    { name: 'kind', type: 'string' },
    { name: 'partiallyFillable', type: 'bool' },
    { name: 'sellTokenBalance', type: 'string' },
    { name: 'buyTokenBalance', type: 'string' },
  ] as Array<{ name: string; type: string }>,
} as const;

export type CowOrderInput = {
  sellToken: Hex;
  buyToken: Hex;
  receiver: Hex;
  sellAmount: string; // uint256 as string
  buyAmount: string; // uint256 as string
  validTo: number; // uint32
  appData: string; // can be JSON string or 0x bytes32
  feeAmount: string; // uint256 as string
  kind: string; // 'sell' | 'buy'
  partiallyFillable: boolean;
  sellTokenBalance: string; // 'erc20'
  buyTokenBalance: string; // 'erc20'
};

export async function signIntent({
  chainId,
  from,
  order,
  verifyingContract,
  messenger,
}: {
  chainId: number;
  from: Hex;
  order: CowOrderInput;
  verifyingContract: Hex;
  messenger: TransactionControllerInitMessenger;
}): Promise<Hex> {
  const appDataHex = normalizeAppData(order.appData);
  const orderForSign = { ...order, appData: appDataHex } as const;
  const data: MessageParamsTypedData = {
    // Cast to Json-compatible structure for the signature controller
    types: (TYPES_COW_ORDER as unknown) as Record<string, Json>,
    primaryType: 'Order',
    domain: {
      name: 'Gnosis Protocol',
      version: 'v2',
      chainId: String(chainId),
      verifyingContract,
    },
    message: (orderForSign as unknown) as Json,
  };

  return (await messenger.call(
    'KeyringController:signTypedMessage',
    {
      from,
      data,
    },
    SignTypedDataVersion.V4,
  )) as Hex;
}

function normalizeAppData(appData: string): Hex {
  if (isBytes32Hex(appData)) {
    return appData as Hex;
  }
  // Hash JSON/string appData to bytes32 per CoW spec
  const bytes = toUtf8Bytes(appData);
  return keccak256(bytes) as Hex;
}

function isBytes32Hex(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}
