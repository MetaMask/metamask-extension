import React from 'react';
import configureMockStore from 'redux-mock-store';

import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { getMockTypedSignPermissionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { Expiry } from './expiry';

describe('Expiry', () => {
  const getMockStore = () => {
    const state = getMockTypedSignPermissionConfirmState();
    return configureMockStore([])(state);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with expiry timestamp', () => {
    it('renders DateAndTimeRow with the expiry timestamp', () => {
      const expiry = 1234567890 + 86400; // 1 day later
      const { container } = renderWithConfirmContextProvider(
        <Expiry expiry={expiry} />,
        getMockStore(),
      );

      expect(container).toBeInTheDocument();
      expect(container.textContent).toContain('Expiration');
      // DateAndTimeRow should format the date
      expect(container.textContent).not.toContain('Never expires');
    });

    it('displays formatted date for valid timestamp', () => {
      const expiry = 1609459200; // Jan 1, 2021 00:00:00 UTC
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

    it('uses ConfirmInfoRow instead of DateAndTimeRow', () => {
      const { container } = renderWithConfirmContextProvider(
        <Expiry expiry={null} />,
        getMockStore(),
      );

      expect(container).toBeInTheDocument();
      expect(container.textContent).toContain('Never expires');
    });
  });

  describe('edge cases', () => {
    it('handles zero timestamp as truthy (displays as date)', () => {
      const { container } = renderWithConfirmContextProvider(
        <Expiry expiry={0} />,
        getMockStore(),
      );

      expect(container).toBeInTheDocument();
      // Zero is falsy in JavaScript, so should show "Never expires"
      expect(container.textContent).toContain('Never expires');
    });

    it('handles very large timestamps', () => {
      const expiry = 9999999999; // Far future timestamp
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
