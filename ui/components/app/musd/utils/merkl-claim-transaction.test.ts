import { Interface } from '@ethersproject/abi';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  AGLAMERKL_ADDRESS_LINEA,
  DISTRIBUTOR_CLAIM_ABI,
  MERKL_CLAIM_CHAIN_ID,
  MERKL_DISTRIBUTOR_ADDRESS,
  MERKL_CLAIM_METHOD_ID,
  MUSD_TOKEN_ADDRESS,
} from '../constants';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { isMerklClaimTransaction } from './merkl-claim-transaction';

const MOCK_USER = '0x1234567890abcdef1234567890abcdef12345678';

function encodeClaimData(tokenAddress: string, amount = '5000000'): string {
  const iface = new Interface(DISTRIBUTOR_CLAIM_ABI);
  return iface.encodeFunctionData('claim', [
    [MOCK_USER],
    [tokenAddress],
    [amount],
    [['0x0000000000000000000000000000000000000000000000000000000000000001']],
  ]);
}

function makeTx(overrides: Partial<TransactionMeta> = {}): TransactionMeta {
  const data = encodeClaimData(MUSD_TOKEN_ADDRESS);
  return {
    id: 'tx-1',
    status: 'submitted',
    chainId: MERKL_CLAIM_CHAIN_ID,
    txParams: {
      from: MOCK_USER,
      to: MERKL_DISTRIBUTOR_ADDRESS,
      data,
    },
    ...overrides,
  } as unknown as TransactionMeta;
}

describe('isMerklClaimTransaction', () => {
  it('returns true for Linea mUSD Merkl claim calldata to the distributor', () => {
    expect(isMerklClaimTransaction(makeTx())).toBe(true);
  });

  it('returns false when to is not the distributor', () => {
    expect(
      isMerklClaimTransaction(
        makeTx({
          txParams: {
            from: MOCK_USER,
            to: '0x0000000000000000000000000000000000000001',
            data: encodeClaimData(MUSD_TOKEN_ADDRESS),
          },
        }),
      ),
    ).toBe(false);
  });

  it('returns false when calldata is missing', () => {
    expect(
      isMerklClaimTransaction(
        makeTx({
          txParams: { from: MOCK_USER, to: MERKL_DISTRIBUTOR_ADDRESS },
        }),
      ),
    ).toBe(false);
  });

  it('returns false when calldata is not claim selector', () => {
    expect(
      isMerklClaimTransaction(
        makeTx({
          txParams: {
            from: MOCK_USER,
            to: MERKL_DISTRIBUTOR_ADDRESS,
            data: '0xdeadbeef',
          },
        }),
      ),
    ).toBe(false);
  });

  it('returns false when chain is not Linea', () => {
    expect(
      isMerklClaimTransaction(
        makeTx({
          chainId: CHAIN_IDS.MAINNET,
        }),
      ),
    ).toBe(false);
  });

  it('returns false when reward token is not mUSD', () => {
    const data = encodeClaimData(AGLAMERKL_ADDRESS_LINEA);
    expect(
      isMerklClaimTransaction(
        makeTx({
          txParams: {
            from: MOCK_USER,
            to: MERKL_DISTRIBUTOR_ADDRESS,
            data,
          },
        }),
      ),
    ).toBe(false);
  });

  it('returns false when calldata cannot be decoded as claim', () => {
    expect(
      isMerklClaimTransaction(
        makeTx({
          txParams: {
            from: MOCK_USER,
            to: MERKL_DISTRIBUTOR_ADDRESS,
            data: `${MERKL_CLAIM_METHOD_ID}00`,
          },
        }),
      ),
    ).toBe(false);
  });
});
