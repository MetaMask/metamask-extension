import React from 'react';
import configureMockStore from 'redux-mock-store';

import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { getMockTypedSignPermissionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { Expiry } from './expiry';

describe('Expiry', () => {
  const mockDecodedPermission = {
    expiry: 1234567890 + 86400,
    origin: 'https://metamask.github.io',
    permission: {
      type: 'erc20-token-stream',
      isAdjustmentAllowed: false,
      data: {
        tokenAddress: '0xA0b86a33E6441b8c4C8C0E4A8e4A8e4A8e4A8e4A',
        initialAmount: '0x1234',
        maxAmount: '0x5678',
        amountPerSecond: '0x9abc',
        startTime: 1234567890,
      },
      justification: 'Test justification',
    },
    chainId: '0x1',
    to: '0xCdD6132d1a6efA06bce1A89b0fEa6b08304A3829',
  } as const;

  const getMockStore = () => {
    const state = getMockTypedSignPermissionConfirmState(mockDecodedPermission);
    return configureMockStore([])(state);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with expiry timestamp', () => {
    it('renders DateAndTimeRow with the expiry timestamp', () => {
      const expiry = 1234567890 + 86400;
      const { container } = renderWithConfirmContextProvider(
        <Expiry expiry={expiry} />,
        getMockStore(),
      );

      expect(container).toBeInTheDocument();
      expect(container.textContent).toContain('Expiration');
      expect(container.textContent).not.toContain('Never expires');
    });

    it('displays formatted date for valid timestamp', () => {
      const expiry = 1609459200;
      const { container } = renderWithConfirmContextProvider(
        <Expiry expiry={expiry} />,
        getMockStore(),
      );

      expect(container).toBeInTheDocument();
      expect(container.textContent).toContain('Expiration');
      expect(container.textContent).toContain('01 January 2021');
    });
  });

  describe('without expiry (null)', () => {
    it('renders "Never expires" message', () => {
      const { container } = renderWithConfirmContextProvider(
        <Expiry expiry={null} />,
        getMockStore(),
      );

      expect(container).toBeInTheDocument();
      expect(container.textContent).toContain('Expiration');
      expect(container.textContent).toContain('Never expires');
    });
  });

  describe('edge cases', () => {
    it('handles zero timestamp', () => {
      const { container } = renderWithConfirmContextProvider(
        <Expiry expiry={0} />,
        getMockStore(),
      );

      expect(container).toBeInTheDocument();
      expect(container.textContent).toContain('Never expires');
    });

    it('handles very large timestamps', () => {
      const expiry = 9999999999;
      const { container } = renderWithConfirmContextProvider(
        <Expiry expiry={expiry} />,
        getMockStore(),
      );

      expect(container).toBeInTheDocument();
      expect(container.textContent).toContain('Expiration');
      expect(container.textContent).not.toContain('Never expires');
    });
  });
});
