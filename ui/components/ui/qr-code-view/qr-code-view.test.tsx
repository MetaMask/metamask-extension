import React from 'react';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import QRCodeView from './qr-code-view';

const mockCopy = jest.fn();
jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => [null, mockCopy],
}));

const mockEthAddress = '0x467060a50CB7bBd2209017323b794130184195a0';
const mockBtcAddress = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';

const render = (
  {
    Qr,
    warning,
  }: { Qr: { message: string; data: string }; warning: null | string } = {
    Qr: { data: mockEthAddress, message: '' },
    warning: '',
  },
) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
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
      expected: mockEthAddress,
      message: '',
    },
    {
      test: 'checksummed ETH address',
      data: mockEthAddress,
      expected: mockEthAddress,
      message: '',
    },
    {
      test: 'BTC address',
      data: mockBtcAddress,
      expected: mockBtcAddress,
      message: '',
    },
  ])(
    'renders the $test',
    async ({
      data,
      message,
      expected,
    }: {
      data: string;
      message: string;
      expected: string;
    }) => {
      const user = userEvent.setup();
      const { container } = render({
        Qr: { data, message },
        warning: '',
      });
      const qrCodeImage = container.querySelector(
        '[data-testid="qr-code-image"]',
      );
      expect(qrCodeImage).toBeInTheDocument();

      const copyButton = container.querySelector(
        '[data-testid="address-copy-button-text"]',
      );
      expect(copyButton).toBeInTheDocument();
      await user.click(copyButton as HTMLElement);

      await waitFor(() => {
        expect(mockCopy).toHaveBeenCalledWith(expected);
      });
    },
  );
});
