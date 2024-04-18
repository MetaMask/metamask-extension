import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import QRCodeModal from './qr-code-modal';

// Mocking the Redux store
const mockStore = configureMockStore([thunk]);
const store = mockStore({
  metamask: {
    institutionalFeatures: {
      channelId: 'channel123',
    },
  },
});

const mockGenerateKey = jest.fn();
const mockDecrypt = jest.fn();
window.crypto = {
  subtle: {
    generateKey: mockGenerateKey,
    decrypt: mockDecrypt,
    exportKey: jest.fn(() => Promise.resolve(new ArrayBuffer(8))),
  },
};

const mockHandleClose = jest.fn();
const props = {
  onClose: mockHandleClose,
  custodianName: 'Test Custodian',
  custodianURL: 'http://testcustodian.com',
};

describe('QRCodeModal', () => {
  beforeAll(() => {
    const mockCrypto = {
      subtle: {
        async generateKey() {
          return {
            publicKey: 'publicKey',
            privateKey: 'privateKey',
          };
        },
        async exportKey() {
          return new Uint8Array([1, 2, 3, 4]).buffer;
        },
        async decrypt() {
          return new TextEncoder().encode('decrypted message');
        },
      },
    };

    Object.defineProperty(window, 'crypto', {
      value: mockCrypto,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays the QR code when qrCodeValue is provided', async () => {
    const mockedStore = mockStore({
      metamask: {
        institutionalFeatures: {
          channelId: 'channel123',
        },
      },
      qrCodeValue: 'example-qr-code-value',
    });

    const { getByTestId } = render(
      <Provider store={mockedStore}>
        <QRCodeModal {...props} />
      </Provider>,
    );

    await waitFor(() => {
      const qrCodeElement = getByTestId('qr-code-visible');
      expect(qrCodeElement).toBeInTheDocument();
    });
  });

  it('handles onClose when the close button is clicked', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <QRCodeModal {...props} />
      </Provider>,
    );
    const closeButton = getByTestId('cancel-btn');

    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(mockHandleClose).toHaveBeenCalledTimes(1);
    });
  });
});
