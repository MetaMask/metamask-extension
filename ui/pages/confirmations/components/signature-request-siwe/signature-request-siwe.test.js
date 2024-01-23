import React from 'react';
import { cloneDeep } from 'lodash';
import { fireEvent } from '@testing-library/react';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import SignatureRequestSIWE from '.';

const MOCK_ORIGIN = 'https://example-dapp.website';
const MOCK_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const mockStoreInitialState = {
  metamask: {
    ...mockState.metamask,
    subjectMetadata: {
      [MOCK_ORIGIN]: {
        iconUrl: 'https://example-dapp.website/favicon-32x32.png',
        name: 'Example Test Dapp',
      },
    },
  },
};

const mockShowModal = jest.fn();

jest.mock('../../../store/actions.ts', () => {
  return {
    showModal: () => mockShowModal,
  };
});

const mockProps = {
  cancelPersonalMessage: jest.fn(),
  signPersonalMessage: jest.fn(),
  txData: {
    msgParams: {
      from: MOCK_ADDRESS,
      data: '0x6c6f63616c686f73743a383038302077616e747320796f7520746f207369676e20696e207769746820796f757220457468657265756d206163636f756e743a0a3078466232433135303034333433393034653566343038323537386334653865313131303563463765330a0a436c69636b20746f207369676e20696e20616e642061636365707420746865205465726d73206f6620536572766963653a2068747470733a2f2f636f6d6d756e6974792e6d6574616d61736b2e696f2f746f730a0a5552493a20687474703a2f2f6c6f63616c686f73743a383038300a56657273696f6e3a20310a436861696e2049443a20310a4e6f6e63653a2053544d74364b514d7777644f58453330360a4973737565642041743a20323032322d30332d31385432313a34303a34302e3832335a0a5265736f75726365733a0a2d20697066733a2f2f516d653773733341525667787636725871565069696b4d4a3875324e4c676d67737a673133705972444b456f69750a2d2068747470733a2f2f6578616d706c652e636f6d2f6d792d776562322d636c61696d2e6a736f6e',
      origin: MOCK_ORIGIN,
      siwe: {
        isSIWEMessage: true,
        parsedMessage: {
          domain: 'example-dapp.website',
          address: MOCK_ADDRESS,
          statement:
            'Click to sign in and accept the Terms of Service: https://community.metamask.io/tos',
          uri: 'http://localhost:8080',
          version: '1',
          nonce: 'STMt6KQMwwdOXE306',
          chainId: 1,
          issuedAt: '2023-03-18T21:40:40.823Z',
          resources: [
            'ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu',
            'https://example.com/my-web2-claim.json',
          ],
        },
      },
    },
    type: MESSAGE_TYPE.PERSONAL_SIGN,
  },
};

jest.mock('../ledger-instruction-field', () => {
  return {
    __esModule: true,
    default: () => {
      return <div className="mock-ledger-instruction-field" />;
    },
  };
});

const render = (txData = mockProps.txData) => {
  const store = configureStore(mockStoreInitialState);

  return renderWithProvider(
    <SignatureRequestSIWE {...mockProps} txData={txData} />,
    store,
  );
};

describe('SignatureRequestSIWE (Sign in with Ethereum)', () => {
  it('should match snapshot', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('should render', async () => {
    const { container, findByText } = render();
    const bannerAlert = container.querySelector('.mm-banner-alert');

    expect(bannerAlert).not.toBeTruthy();
    expect(await findByText('Sign-in request')).toBeInTheDocument();
  });

  it('should render SiteOrigin', () => {
    const { container } = render();
    const siteOriginElem = container.querySelector('.site-origin');
    expect(siteOriginElem).toHaveTextContent(MOCK_ORIGIN);
  });

  it('should render BannerAlert when addresses do not match', () => {
    const store = configureStore(mockStoreInitialState);
    const txData = cloneDeep(mockProps.txData);
    txData.msgParams.siwe.parsedMessage.address = '0x12345';

    const { container } = renderWithProvider(
      <SignatureRequestSIWE {...mockProps} txData={txData} />,
      store,
    );
    const bannerAlert = container.querySelector('.mm-banner-alert');

    expect(bannerAlert).toBeTruthy();
    expect(bannerAlert).toHaveTextContent('does not match the address');
  });

  it('should render BannerAlert when domains do not match', () => {
    const store = configureStore(mockStoreInitialState);
    const txData = cloneDeep(mockProps.txData);
    txData.msgParams.siwe.parsedMessage.domain = 'potentially-malicious.com';

    const { container } = renderWithProvider(
      <SignatureRequestSIWE {...mockProps} txData={txData} />,
      store,
    );
    const bannerAlert = container.querySelector('.mm-banner-alert');

    expect(bannerAlert).toBeTruthy();
    expect(bannerAlert).toHaveTextContent('Deceptive site request.');
  });

  it('should not show Ledger instructions if the address is not a Ledger address', () => {
    const { container } = render();
    expect(
      container.querySelector('.mock-ledger-instruction-field'),
    ).not.toBeTruthy();
  });

  it('should show Ledger instructions if the address is a Ledger address', () => {
    const mockTxData = cloneDeep(mockProps.txData);
    mockTxData.msgParams.from = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
    const { container } = render(mockTxData);

    expect(
      container.querySelector('.mock-ledger-instruction-field'),
    ).toBeTruthy();
  });

  describe('when there is only one unconfirmed tx', () => {
    it('should not show multiple notifications header', () => {
      const store = configureStore(mockStoreInitialState);
      const txData = cloneDeep(mockProps.txData);

      const { container } = renderWithProvider(
        <SignatureRequestSIWE {...mockProps} txData={txData} />,
        store,
      );

      expect(
        container.querySelector('.confirm-page-container-navigation'),
      ).toHaveStyle('display: none');
    });

    it('should not show Reject request button', () => {
      const { container } = render();
      expect(
        container.querySelector('.request-signature__container__reject'),
      ).not.toBeInTheDocument();
    });
  });

  describe('when there is more than one unconfirmed tx', () => {
    let renderResult;

    beforeEach(() => {
      const store = configureStore({
        ...mockStoreInitialState,
        metamask: {
          ...mockStoreInitialState.metamask,
          transactions: [
            ...mockStoreInitialState.metamask.transactions,
            {
              chainId: mockStoreInitialState.metamask.providerConfig.chainId,
              status: 'unapproved',
            },
          ],
          unapprovedMsgCount: 2,
        },
      });

      const txData = cloneDeep(mockProps.txData);
      renderResult = renderWithProvider(
        <SignatureRequestSIWE {...mockProps} txData={txData} />,
        store,
      );
    });

    afterEach(() => {
      renderResult = null;
    });

    it('should show multiple notifications header', () => {
      const { container } = renderResult;
      expect(
        container.getElementsByClassName('signature-request-siwe-header'),
      ).toHaveLength(1);

      expect(
        container.querySelector('.confirm-page-container-navigation'),
      ).toHaveStyle('display: flex');
    });

    it('should show Reject request button', () => {
      const { getByText } = renderResult;
      const cancelAll = getByText('Reject 2 requests');

      expect(cancelAll).toHaveClass('request-signature__container__reject');
      expect(cancelAll).toBeInTheDocument();
    });

    it('should show cancel all modal on Reject request button click', () => {
      const { getByText } = renderResult;
      const cancelAll = getByText('Reject 2 requests');

      fireEvent.click(cancelAll);
      expect(mockShowModal).toHaveBeenCalled();
    });
  });

  it('should display security alert if present', () => {
    const store = configureStore(mockStoreInitialState);
    const txData = cloneDeep(mockProps.txData);

    const { getByText } = renderWithProvider(
      <SignatureRequestSIWE
        {...mockProps}
        txData={{
          ...txData,
          securityAlertResponse: {
            resultType: 'Malicious',
            reason: 'blur_farming',
            description:
              'A SetApprovalForAll request was made on {contract}. We found the operator {operator} to be malicious',
            args: {
              contract: '0xa7206d878c5c3871826dfdb42191c49b1d11f466',
              operator: '0x92a3b9773b1763efa556f55ccbeb20441962d9b2',
            },
          },
        }}
      />,
      store,
    );

    expect(getByText('This is a deceptive request')).toBeInTheDocument();
  });
});
