import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import InfoTab from '.';

describe('InfoTab', () => {
  const mockStore = configureMockStore([thunk])(mockState);
  describe('validate links', () => {
    let getByRole: (role: string, options?: { name: string }) => HTMLElement;
    let getByText: (text: string) => HTMLElement;
    let getByTestId: (testId: string) => HTMLElement;

    beforeEach(() => {
      const renderResult = renderWithProvider(<InfoTab />, mockStore);
      getByRole = renderResult.getByRole;
      getByText = renderResult.getByText;
      getByTestId = renderResult.getByTestId;
    });

    it('should have correct href for "Privacy Policy" link', () => {
      const privacyPolicyLink = getByRole('link', { name: 'Privacy Policy' });
      expect(privacyPolicyLink).toHaveAttribute(
        'href',
        'https://metamask.io/privacy.html',
      );
    });

    it('should have correct href for "Terms of Use" link', () => {
      const termsOfUseLink = getByRole('link', { name: 'Terms of Use' });
      expect(termsOfUseLink).toHaveAttribute(
        'href',
        'https://metamask.io/terms.html',
      );
    });

    it('should have correct href for "Attributions" link', () => {
      const attributionsLink = getByRole('link', { name: 'Attributions' });
      expect(attributionsLink).toHaveAttribute(
        'href',
        `https://raw.githubusercontent.com/MetaMask/metamask-extension/vMOCK_VERSION/attribution.txt`,
      );
    });

    it('should trigger support modal when click support link', () => {
      const supportLink = getByText('Visit our support center');
      fireEvent.click(supportLink);
      expect(
        getByTestId('visit-support-data-consent-modal'),
      ).toBeInTheDocument();
    });

    it('should have correct href for "Visit our website" link', () => {
      const websiteLink = getByRole('link', { name: 'Visit our website' });
      expect(websiteLink).toHaveAttribute('href', 'https://metamask.io/');
    });

    it('should have correct href for "Contact us" link', () => {
      const contactUsLink = getByRole('link', { name: 'Contact us' });
      expect(contactUsLink).toHaveAttribute(
        'href',
        'https://support.metamask.io',
      );
    });
  });
});
