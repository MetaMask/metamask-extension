import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { SECURITY_PROVIDER_MESSAGE_SEVERITIES } from '../security-provider-banner-message/security-provider-banner-message.constants';
import SignatureRequest from './signature-request.component';

const baseProps = {
  hardwareWalletRequiresConnection: false,
  clearConfirmTransaction: () => undefined,
  cancel: () => undefined,
  cancelAll: () => undefined,
  mostRecentOverviewPage: '/',
  showRejectTransactionsConfirmationModal: () => undefined,
  sign: () => undefined,
  history: { push: '/' },
  providerConfig: { type: 'rpc' },
  nativeCurrency: 'ABC',
  currentCurrency: 'def',
  fromAccount: {
    address: '0x123456789abcdef',
    balance: '0x346ba7725f412cbfdb',
    name: 'Antonio',
  },
  selectedAccount: {
    address: '0x123456789abcdef',
  },
};

describe('Signature Request Component', () => {
  const store = configureMockStore()(mockState);

  describe('render', () => {
    let messageData;

    beforeEach(() => {
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

    it('should match snapshot when we want to switch to fiat', () => {
      const msgParams = {
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { container } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
          conversionRate={1567}
        />,
        store,
      );

      expect(container).toMatchSnapshot();
    });

    it('should match snapshot when we are using eth', () => {
      const msgParams = {
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { container } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
          conversionRate={null}
        />,
        store,
      );

      expect(container).toMatchSnapshot();
    });

    it('should render navigation', () => {
      const msgParams = {
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { queryByTestId } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
          conversionRate={null}
        />,
        store,
      );

      expect(queryByTestId('navigation-container')).toBeInTheDocument();
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
          {...baseProps}
          txData={{
            msgParams,
          }}
          conversionRate={null}
        />,
        store,
      );

      expect(queryByText('do_not_display')).not.toBeInTheDocument();
      expect(queryByText('one')).not.toBeInTheDocument();
      expect(queryByText('do_not_display_2')).not.toBeInTheDocument();
      expect(queryByText('two')).not.toBeInTheDocument();
    });

    it('should not render a reject multiple requests link if there is not multiple requests', () => {
      const msgParams = {
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { container } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
          conversionRate={null}
        />,
        store,
      );

      expect(
        container.querySelector('.signature-request__reject-all-button'),
      ).not.toBeInTheDocument();
    });

    it('should render a reject multiple requests link if there is multiple requests (greater than 1)', () => {
      const msgParams = {
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { container } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
          conversionRate={null}
          unapprovedMessagesCount={2}
        />,
        store,
      );

      expect(
        container.querySelector('.signature-request__reject-all-button'),
      ).toBeInTheDocument();
    });

    it('should call reject all button when button is clicked', () => {
      const msgParams = {
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { container } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
          conversionRate={null}
          unapprovedMessagesCount={2}
        />,
        store,
      );

      const rejectRequestsLink = container.querySelector(
        '.signature-request__reject-all-button',
      );
      fireEvent.click(rejectRequestsLink);
      expect(rejectRequestsLink).toBeDefined();
    });

    it('should render text of reject all button', () => {
      const msgParams = {
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          txData={{
            msgParams,
          }}
          conversionRate={null}
          unapprovedMessagesCount={2}
        />,
        store,
      );

      expect(getByText('Reject 2 requests')).toBeInTheDocument();
    });

    it('should render SecurityProviderBannerMessage component properly', () => {
      const msgParams = {
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };

      const { queryByText } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          conversionRate={null}
          txData={{
            msgParams,
            securityProviderResponse: {
              flagAsDangerous: '?',
              reason: 'Some reason...',
              reason_header: 'Some reason header...',
            },
          }}
          unapprovedMessagesCount={2}
        />,
        store,
      );

      expect(queryByText('Request not verified')).toBeInTheDocument();
      expect(
        queryByText(
          'Because of an error, this request was not verified by the security provider. Proceed with caution.',
        ),
      ).toBeInTheDocument();
      expect(queryByText('OpenSea')).toBeInTheDocument();
    });

    it('should not render SecurityProviderBannerMessage component when flagAsDangerous is not malicious', () => {
      const msgParams = {
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };

      const { queryByText } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          conversionRate={null}
          txData={{
            msgParams,
            securityProviderResponse: {
              flagAsDangerous:
                SECURITY_PROVIDER_MESSAGE_SEVERITIES.NOT_MALICIOUS,
            },
          }}
          unapprovedMessagesCount={2}
        />,
        store,
      );

      expect(queryByText('Request not verified')).toBeNull();
      expect(
        queryByText(
          'Because of an error, this request was not verified by the security provider. Proceed with caution.',
        ),
      ).toBeNull();
      expect(queryByText('OpenSea')).toBeNull();
    });

    it('should render a warning when the selected account is not the one being used to sign', () => {
      const msgParams = {
        data: JSON.stringify(messageData),
        version: 'V4',
        origin: 'test',
      };

      const { container } = renderWithProvider(
        <SignatureRequest
          {...baseProps}
          selectedAccount={{
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            balance: '0x0',
            name: 'Account 1',
          }}
          conversionRate={null}
          txData={{
            msgParams,
            securityProviderResponse: {
              flagAsDangerous:
                SECURITY_PROVIDER_MESSAGE_SEVERITIES.NOT_MALICIOUS,
            },
          }}
          unapprovedMessagesCount={2}
        />,
        store,
      );

      expect(
        container.querySelector('.request-signature__mismatch-info'),
      ).toBeInTheDocument();
    });
  });
});
