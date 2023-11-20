import { HttpProvider } from 'ethjs';
import nock from 'nock';
import { toHex } from '@metamask/controller-utils';
import fetchEstimatedL1Fee from './fetchEstimatedL1Fee';

describe('fetchEstimatedL1Fee', () => {
  beforeAll(() => {
    global.ethereumProvider = new HttpProvider(
      'https://optimism-mainnet.public.blastapi.io',
    );
    nock.disableNetConnect();
  });

  it('returns an expected gasFee', async () => {
    const expectedGasFeeResult = '377b09ef6660';
    nock('https://optimism-mainnet.public.blastapi.io:443', {
      encodedQueryParams: true,
    })
      .post('/', {
        method: 'eth_call',
        params: [
          {
            to: '0x420000000000000000000000000000000000000f',
            data: '0x49948e0e00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000023e280830f424082cf0894e7d522230eff653bb0a9b4385f0be0815420dd9880808080800000000000000000000000000000000000000000000000000000000000',
          },
          'latest',
        ],
        id: 1,
        jsonrpc: '2.0',
      })
      .reply(200, {
        jsonrpc: '2.0',
        id: 1,
        result: `0x0000000000000000000000000000000000000000000000000000${expectedGasFeeResult}`,
      });

    const gasFee = await fetchEstimatedL1Fee(toHex(10), {
      txParams: {
        gasPrice: '0xf4240',
        gas: '0xcf08',
        to: '0xe7d522230eff653bb0a9b4385f0be0815420dd98',
        value: '0x0',
        from: '0x806627172af48bd5b0765d3449a7def80d6576ff',
        data: null,
        type: '0x0',
      },
    });
    expect(gasFee).toStrictEqual(`0x${expectedGasFeeResult}`);
  });
});
