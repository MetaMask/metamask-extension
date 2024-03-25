import React from 'react';
import { renderWithProvider } from '../../../../test/jest/rendering';
import InfoTab from '.';

describe('InfoTab', () => {
  describe('validate links', () => {
    let getByText: (text: string) => HTMLElement;

    beforeEach(() => {
      const renderResult = renderWithProvider(<InfoTab />);
      getByText = renderResult.getByText;
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
        'https://metamask.io/attributions.html',
      );
    });

    it('should have correct href for "Support" link', () => {
      const supportLink = getByText('Visit our support center');
      expect(supportLink).toHaveAttribute(
        'href',
        'https://support.metamask.io',
      );
    });

    it('should have correct href for "Visit our website" link', () => {
      const websiteLink = getByText('Visit our website');
      expect(websiteLink).toHaveAttribute('href', 'https://metamask.io/');
    });

    it('should have correct href for "Contact us" link', () => {
      const contactUsLink = getByText('Contact us');
      expect(contactUsLink).toHaveAttribute(
        'href',
        'https://metamask.zendesk.com/hc/en-us',
      );
    });
  });
});
