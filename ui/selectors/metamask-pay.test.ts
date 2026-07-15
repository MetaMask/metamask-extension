import type { MetaMaskReduxState } from '../store/store';
import { selectPerpsWithdrawMetamaskPayByHash } from './metamask-pay';

describe('selectPerpsWithdrawMetamaskPayByHash', () => {
  const from = '0x9bed78535d6a03a955f1504aadba974d9a29e292';
  const e756 =
    '0xe756c05232a58461c4efca154f25e77af2310ea991437538d1b19b95f9729f79';
  const b4bf =
    '0xb4bfaca54073ed457829750a2c4e8456b4b41ee4f1c4e0783d5999def4c52eca';
  const data =
    '0xa9059cbb0000000000000000000000009bed78535d6a03a955f1504aadba974d9a29e29200000000000000000000000000000000000000000000000000000000000186a0';

  it('maps destination pay onto the related outbound perpsWithdraw hash', () => {
    const state = {
      metamask: {
        transactions: [
          {
            id: 'outbound',
            type: 'perpsWithdraw',
            status: 'confirmed',
            chainId: '0xa4b1',
            hash: e756,
            txParams: { from, to: '0xaf88', data, value: '0x0' },
          },
          {
            id: 'pay',
            type: 'perpsWithdraw',
            status: 'confirmed',
            chainId: '0xa4b1',
            hash: b4bf,
            txParams: { from, to: '0xaf88', data, value: '0x0' },
            metamaskPay: {
              isPostQuote: true,
              sourceHash:
                '0xe0c725b424530c29e240043feeac740202210099bf562afb848fd106e356e614',
              targetFiat: '0.040904',
              totalFiat: '0.159104',
              chainId: '0x1',
              tokenAddress: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
            },
          },
        ],
      },
    } as unknown as MetaMaskReduxState;

    expect(
      selectPerpsWithdrawMetamaskPayByHash(state).get(e756)?.totalFiat,
    ).toBe('0.159104');
  });
});
