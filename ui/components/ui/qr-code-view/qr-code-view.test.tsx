import React from 'react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import QRCodeView from './qr-code-view';

const mockEthAddress = '0x467060a50CB7bBd2209017323b794130184195a0';
const mockBtcAddress = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';

const render = (
  {
    Qr,
    warning,
  }: // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  { Qr: { message: string; data: string }; warning: null | string } = {
    Qr: { data: mockEthAddress, message: '' },
    warning: '',
  },
) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  // @ts-expect-error TODO: Remove once `react-redux` is upgraded to v8 and `connect` type is fixed.
  return renderWithProvider(<QRCodeView Qr={Qr} warning={warning} />, store);
};

describe('QRCodeView', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders QR code image', () => {
    const { container } = render();
    const qrCodeImage = container.querySelector(
      '[data-testid="qr-code-image"]',
    );
    expect(qrCodeImage).toBeInTheDocument();
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    {
      test: 'lowercased ETH address to checksummed',
      data: mockEthAddress.toLowerCase(),
      message: '',
    },
    {
      test: 'checksummed ETH address',
      data: mockEthAddress,
      message: '',
    },
    {
      test: 'BTC address',
      data: mockBtcAddress,
      message: '',
    },
  ])(
    'it renders the $test',
    async ({ data, message }: { data: string; message: string }) => {
      const { container } = render({
        Qr: { data, message },
        warning: '',
      });
      const qrCodeImage = container.querySelector(
        '[data-testid="qr-code-image"]',
      );
      expect(qrCodeImage).toBeInTheDocument();
    },
  );
});
