import React from 'react';
import { shallowWithContext } from '../../../../test/lib/render-helpers';
import SignatureRequest from './signature-request.component';
import Message from './signature-request-message';

describe('Signature Request Component', () => {
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

    it('should render a div message parsed', () => {
      const msgParams = {
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const wrapper = shallowWithContext(
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
      );

      expect(wrapper.is('div')).toStrictEqual(true);
      expect(wrapper).toHaveLength(1);
      expect(wrapper.hasClass('signature-request')).toStrictEqual(true);
      const messageWrapper = wrapper.find(Message);
      expect(messageWrapper).toHaveLength(1);
      const { data, primaryType } = messageWrapper.props();
      expect(primaryType).toStrictEqual('Mail');
      expect(data.contents).toStrictEqual('Hello, Bob!');
      expect(data.from.name).toStrictEqual('Cow');
      expect(data.from.wallets).toBeDefined();
      expect(data.from.wallets).toHaveLength(2);
      expect(data.to).toBeDefined();
      const dataTo = data.to;
      expect(dataTo[0].name).toStrictEqual('Bob');
      expect(dataTo[0].wallets).toHaveLength(3);
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
      const wrapper = shallowWithContext(
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
      );

      expect(wrapper.is('div')).toStrictEqual(true);
      expect(wrapper).toHaveLength(1);
      expect(wrapper.hasClass('signature-request')).toStrictEqual(true);
      const messageWrapper = wrapper.find(Message);
      expect(messageWrapper).toHaveLength(1);
      const { data } = messageWrapper.props();
      expect(data.contents).toStrictEqual('Hello, Bob!');
      expect(data.from.name).toStrictEqual('Cow');
      expect(data.from.wallets).toBeDefined();
      expect(data.from.wallets).toHaveLength(2);
      expect(data.to).toBeDefined();
      const dataTo = data.to;
      expect(dataTo[0].name).toStrictEqual('Bob');
      expect(dataTo[0].wallets).toHaveLength(3);

      expect(data.do_not_display).toBeUndefined();
      expect(data.do_not_display2).toBeUndefined();
    });
  });
});
