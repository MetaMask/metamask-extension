import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import AboutInfo from './about-info';

jest.mock(
  '../../../components/app/modals/visit-support-data-consent-modal',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div data-testid="visit-support-data-consent-modal" /> : null,
    useOpenSupport: (showConsentModal: () => void) => showConsentModal,
  }),
);

describe('AboutInfo', () => {
  const mockStore = configureMockStore([thunk])(mockState);
  describe('validate links', () => {
    let getByRole: (role: string, options?: { name: string }) => HTMLElement;
    let getByText: (text: string) => HTMLElement;
    let getByTestId: (testId: string) => HTMLElement;

    beforeEach(() => {
      const renderResult = renderWithProvider(<AboutInfo />, mockStore);
      getByRole = renderResult.getByRole;
      getByText = renderResult.getByText;
      getByTestId = renderResult.getByTestId;
    });

    it('should have correct href for "Privacy Policy" link', () => {
      const privacyPolicyLink = getByRole('link', {
        name: messages.privacyMsg.message,
      });
      expect(privacyPolicyLink).toHaveAttribute(
        'href',
        'https://metamask.com/privacy.html',
      );
    });

    it('should have correct href for "Terms of Use" link', () => {
      const termsOfUseLink = getByRole('link', {
        name: messages.onboardingLoginFooterTermsOfUse.message,
      });
      expect(termsOfUseLink).toHaveAttribute(
        'href',
        'https://metamask.com/terms.html',
      );
    });

    it('should have correct href for "Attributions" link', () => {
      const attributionsLink = getByRole('link', {
        name: messages.attributions.message,
      });
      expect(attributionsLink).toHaveAttribute(
        'href',
        'https://raw.githubusercontent.com/MetaMask/metamask-extension/main/attribution.txt',
      );
    });

    it('should trigger support modal when click support link', () => {
      const supportLink = getByText(messages.supportCenter.message);
      fireEvent.click(supportLink);
      expect(
        getByTestId('visit-support-data-consent-modal'),
      ).toBeInTheDocument();
    });

    it('should have correct href for "Visit our website" link', () => {
      const websiteLink = getByRole('link', {
        name: messages.visitWebSite.message,
      });
      expect(websiteLink).toHaveAttribute('href', 'https://metamask.io/');
    });

    it('should trigger support modal when click "Contact us"', () => {
      const contactUsButton = getByText(messages.contactUs.message);
      fireEvent.click(contactUsButton);
      expect(
        getByTestId('visit-support-data-consent-modal'),
      ).toBeInTheDocument();
    });
  });
});
