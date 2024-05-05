import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import QRCodeModal from './qr-code-modal';

const mockStore = configureMockStore([thunk]);

const mockHandleClose = jest.fn();
const props = {
  onClose: mockHandleClose,
  custodianName: 'Test Custodian',
  custodianURL: 'http://testcustodian.com',
  setQrConnectionRequest: jest.fn(),
};

describe('QRCodeModal', () => {
  beforeEach(() => {
    const mockCrypto = {
      subtle: {
        generateKey: jest.fn(() =>
          Promise.resolve({
            publicKey: { fake: 'publicKey' },
            privateKey: { fake: 'privateKey' },
          }),
        ),
        exportKey: jest.fn(() =>
          Promise.resolve(new Uint8Array([1, 2, 3, 4]).buffer),
        ),
        decrypt: jest.fn(() =>
          Promise.resolve(
            new TextEncoder().encode(
              JSON.stringify({ data: 'decrypted data' }),
            ),
          ),
        ),
      },
    };

    Object.defineProperty(window, 'crypto', {
      value: mockCrypto,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should display the QR code when qrCodeValue is set', async () => {
    const store = mockStore({
      metamask: {
        institutionalFeatures: {
          channelId: 'channel123',
        },
      },
    });

    const { getByTestId } = render(
      <Provider store={store}>
        <QRCodeModal {...props} />
      </Provider>,
    );

    await waitFor(() => {
      expect(getByTestId('qr-code-visible')).toBeInTheDocument();
    });
  });

  it('should process and display decrypted data correctly', async () => {
    const store = mockStore({
      metamask: {
        institutionalFeatures: {
          channelId: 'channel123',
          connectionRequest: { payload: btoa('encrypted payload') },
        },
      },
    });

    const { getByTestId } = render(
      <Provider store={store}>
        <QRCodeModal {...props} />
      </Provider>,
    );

    await waitFor(() => {
      expect(window.crypto.subtle.decrypt).toHaveBeenCalled();
      expect(getByTestId('qr-code-visible')).toBeInTheDocument();
    });
  });

  it('should call onClose when the close button is clicked', async () => {
    const store = mockStore({
      metamask: {
        institutionalFeatures: {
          channelId: 'channel123',
        },
      },
    });

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

  it('displays an error message when decryption fails', async () => {
    const initialState = {
      metamask: {
        institutionalFeatures: {
          channelId: 'channel123',
          connectionRequest: { payload: 'encrypted-payload' },
        },
      },
    };
    const localStore = mockStore(initialState);

    jest
      .spyOn(window.crypto.subtle, 'decrypt')
      .mockImplementation(() => Promise.reject(new Error('Decryption failed')));

    const { getByText } = render(
      <Provider store={localStore}>
        <QRCodeModal {...props} />
      </Provider>,
    );

    await waitFor(() => {
      expect(
        getByText(/An error occurred while decrypting data/u),
      ).toBeInTheDocument();
    });
  });

  it('displays an error message when key generation fails', async () => {
    const store = mockStore({
      metamask: {
        institutionalFeatures: {
          channelId: 'channel123',
        },
      },
    });

    jest
      .spyOn(window.crypto.subtle, 'generateKey')
      .mockImplementation(() =>
        Promise.reject(new Error('Key generation failed')),
      );

    const { getByText } = render(
      <Provider store={store}>
        <QRCodeModal {...props} />
      </Provider>,
    );

    await waitFor(() => {
      expect(
        getByText(/An error occurred while generating cryptographic keys/u),
      ).toBeInTheDocument();
    });
  });
});
