import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { SECURITY_PROVIDER_MESSAGE_SEVERITIES } from '../security-provider-banner-message/security-provider-banner-message.constants';
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

    it('should match snapshot when useNativeCurrencyAsPrimaryCurrency is false', () => {
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
          cancelAll={() => undefined}
          mostRecentOverviewPage="/"
          showRejectTransactionsConfirmationModal={() => undefined}
          history={{ push: '/' }}
          sign={() => undefined}
          txData={{
            msgParams,
          }}
          fromAccount={{ address: fromAddress }}
          provider={{ type: 'rpc' }}
          useNativeCurrencyAsPrimaryCurrency={false}
          nativeCurrency="ABC"
          currentCurrency="DEF"
        />,
        store,
      );

      expect(container).toMatchSnapshot();
    });

    it('should match snapshot when useNativeCurrencyAsPrimaryCurrency is true', () => {
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
          cancelAll={() => undefined}
          mostRecentOverviewPage="/"
          showRejectTransactionsConfirmationModal={() => undefined}
          history={{ push: '/' }}
          sign={() => undefined}
          txData={{
            msgParams,
          }}
          fromAccount={{ address: fromAddress }}
          provider={{ type: 'rpc' }}
          useNativeCurrencyAsPrimaryCurrency
          nativeCurrency="ABC"
          currentCurrency="DEF"
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
          hardwareWalletRequiresConnection={false}
          clearConfirmTransaction={() => undefined}
          cancel={() => undefined}
          cancelAll={() => undefined}
          mostRecentOverviewPage="/"
          showRejectTransactionsConfirmationModal={() => undefined}
          history={{ push: '/' }}
          sign={() => undefined}
          txData={{
            msgParams,
          }}
          fromAccount={{ address: fromAddress }}
          provider={{ type: 'rpc' }}
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
          hardwareWalletRequiresConnection={false}
          clearConfirmTransaction={() => undefined}
          cancel={() => undefined}
          cancelAll={() => undefined}
          mostRecentOverviewPage="/"
          showRejectTransactionsConfirmationModal={() => undefined}
          history={{ push: '/' }}
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

    it('should not render a reject multiple requests link if there is not multiple requests', () => {
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
          cancelAll={() => undefined}
          mostRecentOverviewPage="/"
          showRejectTransactionsConfirmationModal={() => undefined}
          history={{ push: '/' }}
          sign={() => undefined}
          txData={{
            msgParams,
          }}
          fromAccount={{ address: fromAddress }}
          provider={{ type: 'rpc' }}
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
          hardwareWalletRequiresConnection={false}
          clearConfirmTransaction={() => undefined}
          cancel={() => undefined}
          cancelAll={() => undefined}
          mostRecentOverviewPage="/"
          showRejectTransactionsConfirmationModal={() => undefined}
          history={{ push: '/' }}
          sign={() => undefined}
          txData={{
            msgParams,
          }}
          fromAccount={{ address: fromAddress }}
          provider={{ type: 'rpc' }}
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
          hardwareWalletRequiresConnection={false}
          clearConfirmTransaction={() => undefined}
          cancel={() => undefined}
          cancelAll={() => undefined}
          mostRecentOverviewPage="/"
          showRejectTransactionsConfirmationModal={() => undefined}
          history={{ push: '/' }}
          sign={() => undefined}
          txData={{
            msgParams,
          }}
          fromAccount={{ address: fromAddress }}
          provider={{ type: 'rpc' }}
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
          hardwareWalletRequiresConnection={false}
          clearConfirmTransaction={() => undefined}
          cancel={() => undefined}
          cancelAll={() => undefined}
          mostRecentOverviewPage="/"
          showRejectTransactionsConfirmationModal={() => undefined}
          history={{ push: '/' }}
          sign={() => undefined}
          txData={{
            msgParams,
          }}
          fromAccount={{ address: fromAddress }}
          provider={{ type: 'rpc' }}
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
          hardwareWalletRequiresConnection={false}
          clearConfirmTransaction={() => undefined}
          cancel={() => undefined}
          cancelAll={() => undefined}
          mostRecentOverviewPage="/"
          showRejectTransactionsConfirmationModal={() => undefined}
          history={{ push: '/' }}
          sign={() => undefined}
          txData={{
            msgParams,
            securityProviderResponse: {
              flagAsDangerous: '?',
              reason: 'Some reason...',
              reason_header: 'Some reason header...',
            },
          }}
          fromAccount={{ address: fromAddress }}
          provider={{ type: 'rpc' }}
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
      expect(
        queryByText('This is based on information from'),
      ).toBeInTheDocument();
    });

    it('should not render SecurityProviderBannerMessage component when flagAsDangerous is not malicious', () => {
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
          cancelAll={() => undefined}
          mostRecentOverviewPage="/"
          showRejectTransactionsConfirmationModal={() => undefined}
          history={{ push: '/' }}
          sign={() => undefined}
          txData={{
            msgParams,
            securityProviderResponse: {
              flagAsDangerous:
                SECURITY_PROVIDER_MESSAGE_SEVERITIES.NOT_MALICIOUS,
            },
          }}
          fromAccount={{ address: fromAddress }}
          provider={{ type: 'rpc' }}
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
      expect(queryByText('This is based on information from')).toBeNull();
    });
  });
});
