import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import SignatureRequest from './signature-request.component';

describe('Signature Request Component', () => {
  const store = configureMockStore()(mockState);

  describe('render', () => {
    let fromAddress;
    let messageData;

    beforeEach(() => {
      fromAddress = '0x123456789abcdef';
      messageData = {
        domain: {
          chainId: 97,
          name: 'Ether Mail',
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
          version: '1',
        },
        message: {
          contents: 'Hello, Bob!',
          from: {
            name: 'Cow',
            wallets: [
              '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
              '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
            ],
          },
          to: [
            {
              name: 'Bob',
              wallets: [
                '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                '0xB0B0b0b0b0b0B000000000000000000000000000',
              ],
            },
          ],
        },
        primaryType: 'Mail',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person[]' },
            { name: 'contents', type: 'string' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallets', type: 'address[]' },
          ],
        },
      };
    });

    it('should match snapshot', () => {
      const msgParams = {
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { container } = renderWithProvider(
        <SignatureRequest
          hardwareWalletRequiresConnection={false}
          clearConfirmTransaction={() => undefined}
          cancel={() => undefined}
          sign={() => undefined}
          txData={{
            msgParams,
          }}
          fromAccount={{ address: fromAddress }}
          provider={{ type: 'rpc' }}
        />,
        store,
      );

      expect(container).toMatchSnapshot();
    });

    it('should render a div message parsed without typeless data', () => {
      messageData.message.do_not_display = 'one';
      messageData.message.do_not_display_2 = {
        do_not_display: 'two',
      };
      const msgParams = {
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { queryByText } = renderWithProvider(
        <SignatureRequest
          hardwareWalletRequiresConnection={false}
          clearConfirmTransaction={() => undefined}
          cancel={() => undefined}
          sign={() => undefined}
          txData={{
            msgParams,
          }}
          fromAccount={{ address: fromAddress }}
          provider={{ type: 'rpc' }}
        />,
        store,
      );

      expect(queryByText('do_not_display')).not.toBeInTheDocument();
      expect(queryByText('one')).not.toBeInTheDocument();
      expect(queryByText('do_not_display_2')).not.toBeInTheDocument();
      expect(queryByText('two')).not.toBeInTheDocument();
    });
  });
});
