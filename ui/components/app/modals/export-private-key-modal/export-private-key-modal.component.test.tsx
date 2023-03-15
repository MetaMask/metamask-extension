import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import React from 'react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import ExportPrivateKeyModal from '.';

const mockAddress = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const mockPrivateKey = 'mock private key';
const mockExportAccount = jest.fn().mockResolvedValue(mockPrivateKey);
const mockClearAccountDetail = jest.fn();
const mockHideWarning = jest.fn();

jest.mock('../../../../store/actions', () => ({
  exportAccount: () => mockExportAccount,
  clearAccountDetails: () => mockClearAccountDetail,
  hideWarning: () => mockHideWarning,
}));

describe('Export Private Key Modal', () => {
  const state = {
    metamask: {
      selectedAddress: mockAddress,
      identities: {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          name: 'Test Account',
        },
      },
      provider: {
        type: 'rpc',
        chainId: '0x5',
        ticker: 'ETH',
        id: 'testNetworkConfigurationId',
      },
    },
    appState: {
      warning: null,
      previousModalState: {
        name: null,
      },
      isLoading: false,
      accountDetail: {
        privateKey: null,
      },
      modal: {
        modalState: {},
        previousModalState: {
          name: null,
        },
      },
    },
  };
  const mockStore = configureMockStore([thunk])(state);

  it('renders export private key modal', () => {
    const { queryByText } = renderWithProvider(
      <ExportPrivateKeyModal />,
      mockStore,
    );

    const title = queryByText('Show Private Keys');
    expect(title).toBeInTheDocument();

    const warning = queryByText(
      'Warning: Never disclose this key. Anyone with your private keys can steal any assets held in your account.',
    );
    expect(warning).toBeInTheDocument();
    expect(queryByText(mockPrivateKey)).not.toBeInTheDocument();
  });

  it('renders hold to reveal after entering password', async () => {
    const { queryByText, getByLabelText } = renderWithProvider(
      <ExportPrivateKeyModal />,
      mockStore,
    );

    const nextButton = queryByText('Confirm');
    expect(nextButton).toBeInTheDocument();

    const input = getByLabelText('input-password');

    fireEvent.change(input, {
      target: { value: 'password' },
    });

    fireEvent.click(nextButton as Element);

    await waitFor(() => {
      expect(mockExportAccount).toHaveBeenCalled();
      expect(queryByText('Keep your SRP safe')).toBeInTheDocument();
    });
  });

  it('provides password after passing hold to reveal', async () => {
    const { queryByText, getByLabelText, getByText } = renderWithProvider(
      <ExportPrivateKeyModal />,
      mockStore,
    );

    const nextButton = queryByText('Confirm');
    expect(nextButton).toBeInTheDocument();

    const input = getByLabelText('input-password');
    fireEvent.change(input, {
      target: { value: 'password' },
    });

    fireEvent.click(nextButton as Element);

    await waitFor(() => {
      expect(mockExportAccount).toHaveBeenCalled();
      expect(queryByText('Keep your SRP safe')).toBeInTheDocument();
    });

    const holdButton = getByText('Hold to reveal SRP');
    expect(holdButton).toBeInTheDocument();

    fireEvent.mouseDown(holdButton as Element);

    const circle = getByLabelText('hold-to-reveal-circle');
    fireEvent.transitionEnd(circle);
    const circleUnlocked = getByLabelText('hold-to-reveal-circle-unlocked');
    fireEvent.animationEnd(circleUnlocked);

    await waitFor(() => {
      expect(queryByText('Show Private Keys')).toBeInTheDocument();
      expect(queryByText('Done')).toBeInTheDocument();
      expect(queryByText(mockPrivateKey)).toBeInTheDocument();
    });
  });
});
