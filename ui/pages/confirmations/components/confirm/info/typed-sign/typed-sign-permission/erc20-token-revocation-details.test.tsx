import React from 'react';
import configureMockStore from 'redux-mock-store';

import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { getMockTypedSignPermissionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { Erc20TokenRevocationDetails } from './erc20-token-revocation-details';

describe('Erc20TokenRevocationDetails', () => {
  const defaultExpiry = 1234567890 + 86400; // 1 day later

  const getMockStore = () => {
    // Use default typed sign permission state; the component under test only needs the confirm/i18n context.
    const state = getMockTypedSignPermissionConfirmState();
    return configureMockStore([])(state);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderAndGetDetailsSection = (expiry: number | null) => {
    const { getByTestId } = renderWithConfirmContextProvider(
      <Erc20TokenRevocationDetails expiry={expiry} />,
      getMockStore(),
    );

    return getByTestId('erc20-token-revocation-details-section');
  };

  describe('basic functionality', () => {
    it('renders with expiry and shows expiration row', () => {
      const detailsSection = renderAndGetDetailsSection(defaultExpiry);
      expect(detailsSection).toBeInTheDocument();
      expect(detailsSection?.textContent?.includes('Expiration')).toBe(true);
    });

    it('does not render details section when expiry is null', () => {
      expect(() => renderAndGetDetailsSection(null)).toThrow(
        'Unable to find an element',
      );
    });
  });
});
