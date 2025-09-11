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
    let getByText: (text: string) => HTMLElement;
    let getByTestId: (testId: string) => HTMLElement;

    beforeEach(() => {
      const renderResult = renderWithProvider(<InfoTab />, mockStore);
      getByText = renderResult.getByText;
      getByTestId = renderResult.getByTestId;
    });

    it('should have correct href for "Privacy Policy" link', () => {
      const privacyPolicyLink = getByText('Privacy policy');
      expect(privacyPolicyLink).toHaveAttribute(
        'href',
        'https://metamask.io/privacy.html',
      );
    });

    it('should have correct href for "Terms of Use" link', () => {
      const termsOfUseLink = getByText('Terms of use');
      expect(termsOfUseLink).toHaveAttribute(
        'href',
        'https://metamask.io/terms.html',
      );
    });

    it('should have correct href for "Attributions" link', () => {
      const attributionsLink = getByText('Attributions');
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
      const websiteLink = getByText('Visit our website');
      expect(websiteLink).toHaveAttribute('href', 'https://metamask.io/');
    });

    it('should have correct href for "Contact us" link', () => {
      const contactUsLink = getByText('Contact us');
      expect(contactUsLink).toHaveAttribute(
        'href',
        'https://support.metamask.io',
      );
    });
  });
});
