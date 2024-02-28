import React from 'react';
import * as Sentry from '@sentry/browser';
import { fireEvent, screen } from '@testing-library/react';
import BlockaidPackage from '@blockaid/ppom_release/package.json';

import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { Severity } from '../../../../../helpers/constants/design-system';
import configureStore from '../../../../../store/store';

import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../../../shared/constants/security-provider';
import BlockaidBannerAlert from '.';

jest.mock('@sentry/browser');
jest.mock('zlib', () => ({
  gzipSync: (val) => val,
}));

const mockUpdateTransactionEventFragment = jest.fn();

jest.mock('../../../hooks/useTransactionEventFragment', () => {
  return {
    useTransactionEventFragment: () => {
      return {
        updateTransactionEventFragment: mockUpdateTransactionEventFragment,
      };
    },
  };
});

const mockSecurityAlertResponse = {
  result_type: BlockaidResultType.Warning,
  reason: BlockaidReason.setApprovalForAll,
  description:
    'A SetApprovalForAll request was made on {contract}. We found the operator {operator} to be malicious',
  args: {
    contract: '0xa7206d878c5c3871826dfdb42191c49b1d11f466',
    operator: '0x92a3b9773b1763efa556f55ccbeb20441962d9b2',
  },
};

describe('Blockaid Banner Alert', () => {
  it('should not render when securityAlertResponse is not present', () => {
    const { container } = renderWithProvider(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: undefined,
        }}
      />,
      configureStore(),
    );

    expect(container.querySelector('.mm-banner-alert')).toBeNull();
  });

  it(`should not render when securityAlertResponse.result_type is '${BlockaidResultType.Benign}'`, () => {
    const { container } = renderWithProvider(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: {
            ...mockSecurityAlertResponse,
            result_type: BlockaidResultType.Benign,
          },
        }}
      />,
      configureStore(),
    );

    expect(container.querySelector('.mm-banner-alert')).toBeNull();
  });

  it(`should render '${Severity.Warning}' UI when securityAlertResponse.result_type is '${BlockaidResultType.Errored}`, () => {
    const { container } = renderWithProvider(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: {
            ...mockSecurityAlertResponse,
            result_type: BlockaidResultType.Errored,
          },
        }}
      />,
      configureStore(),
    );
    const warningBannerAlert = container.querySelector(
      '.mm-banner-alert--severity-warning',
    );

    expect(warningBannerAlert).toBeInTheDocument();
    expect(warningBannerAlert).toMatchSnapshot();
  });

  it(`should render '${Severity.Warning}' UI when securityAlertResponse.result_type is '${BlockaidResultType.Warning}`, () => {
    const { container } = renderWithProvider(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: mockSecurityAlertResponse,
        }}
      />,
      configureStore(),
    );
    const warningBannerAlert = container.querySelector(
      '.mm-banner-alert--severity-warning',
    );

    expect(warningBannerAlert).toBeInTheDocument();
    expect(warningBannerAlert).toMatchSnapshot();
  });

  it(`should render '${Severity.Danger}' UI when securityAlertResponse.result_type is '${BlockaidResultType.Malicious}`, () => {
    const { container } = renderWithProvider(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: {
            ...mockSecurityAlertResponse,
            result_type: BlockaidResultType.Malicious,
          },
        }}
      />,
      configureStore(),
    );
    const dangerBannerAlert = container.querySelector(
      '.mm-banner-alert--severity-danger',
    );

    expect(dangerBannerAlert).toBeInTheDocument();
    expect(dangerBannerAlert).toMatchSnapshot();
  });

  it('should render title, "This is a deceptive request"', () => {
    const { getByText } = renderWithProvider(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: mockSecurityAlertResponse,
        }}
      />,
      configureStore(),
    );

    expect(getByText('This is a deceptive request')).toBeInTheDocument();
  });

  it(`should render title, "This is a suspicious request", when the reason is "${BlockaidReason.errored}"`, () => {
    const { getByText } = renderWithProvider(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: {
            ...mockSecurityAlertResponse,
            reason: BlockaidReason.errored,
          },
        }}
      />,
      configureStore(),
    );

    expect(getByText('Request may not be safe')).toBeInTheDocument();
  });

  it(`should render title, "This is a suspicious request", when the reason is "${BlockaidReason.rawSignatureFarming}"`, () => {
    const { getByText } = renderWithProvider(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: {
            ...mockSecurityAlertResponse,
            reason: BlockaidReason.rawSignatureFarming,
          },
        }}
      />,
      configureStore(),
    );

    expect(getByText('This is a suspicious request')).toBeInTheDocument();
  });

  it('should render details when provided', () => {
    const mockFeatures = [
      'Operator is an EOA',
      'Operator is untrusted according to previous activity',
    ];

    const { container, getByText } = renderWithProvider(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: {
            ...mockSecurityAlertResponse,
            features: mockFeatures,
          },
        }}
      />,
      configureStore(),
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.disclosure')).toBeInTheDocument();
    mockFeatures.forEach((feature) => {
      expect(getByText(`• ${feature}`)).toBeInTheDocument();
    });
  });

  it('should render details section even when features is not provided', () => {
    const { container } = renderWithProvider(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: mockSecurityAlertResponse,
          features: undefined,
        }}
      />,
      configureStore(),
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.disclosure')).toBeInTheDocument();
  });

  it('should render link to report url', () => {
    const { container, getByText, getByRole } = renderWithProvider(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: mockSecurityAlertResponse,
          features: undefined,
        }}
      />,
      configureStore(),
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.disclosure')).toBeInTheDocument();
    expect(getByText("Something doesn't look right?")).toBeInTheDocument();
    expect(getByText('Report an issue')).toBeInTheDocument();
    expect(getByRole('link', { name: 'Report an issue' })).toBeInTheDocument();
  });

  it('should pass required data in Report an issue URL', () => {
    const { getByRole } = renderWithProvider(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: mockSecurityAlertResponse,
          features: undefined,
        }}
      />,
      configureStore(),
    );

    const elm = getByRole('link', { name: 'Report an issue' });
    expect(elm.href).toBe(
      `https://blockaid-false-positive-portal.metamask.io/?data=%7B%22blockaidVersion%22%3A%22${BlockaidPackage.version}%22%2C%22classification%22%3A%22set_approval_for_all%22%2C%22resultType%22%3A%22Warning%22%7D&utm_source=metamask-ppom`,
    );
  });

  describe('when constructing the Blockaid Report URL', () => {
    describe(`when result_type='${BlockaidResultType.Errored}'`, () => {
      it('should pass the classification as "error" and the resultType as "Error"', () => {
        const { getByRole } = renderWithProvider(
          <BlockaidBannerAlert
            txData={{
              securityAlertResponse: {
                ...mockSecurityAlertResponse,
                result_type: BlockaidResultType.Errored,
              },
            }}
          />,
          configureStore(),
        );

        const elm = getByRole('link', { name: 'Report an issue' });
        expect(elm.href).toBe(
          `https://blockaid-false-positive-portal.metamask.io/?data=%7B%22blockaidVersion%22%3A%22${BlockaidPackage.version}%22%2C%22classification%22%3A%22error%22%2C%22resultType%22%3A%22Error%22%7D&utm_source=metamask-ppom`,
        );
      });
    });
  });

  describe('when rendering description', () => {
    Object.entries({
      [BlockaidReason.approvalFarming]:
        'If you approve this request, a third party known for scams might take all your assets.',
      [BlockaidReason.blurFarming]:
        'If you approve this request, someone can steal your assets listed on Blur.',
      [BlockaidReason.errored]:
        'Because of an error, this request was not verified by the security provider. Proceed with caution.',
      [BlockaidReason.maliciousDomain]:
        "You're interacting with a malicious domain. If you approve this request, you might lose your assets.",
      [BlockaidReason.other]:
        'If you approve this request, you might lose your assets.',
      [BlockaidReason.permitFarming]:
        'If you approve this request, a third party known for scams might take all your assets.',
      [BlockaidReason.rawNativeTokenTransfer]:
        'If you approve this request, a third party known for scams will take all your assets.',
      [BlockaidReason.rawSignatureFarming]:
        'If you approve this request, you might lose your assets.',
      [BlockaidReason.seaportFarming]:
        'If you approve this request, someone can steal your assets listed on OpenSea.',
      [BlockaidReason.setApprovalForAll]:
        'If you approve this request, a third party known for scams might take all your assets.',
      [BlockaidReason.tradeOrderFarming]:
        'If you approve this request, you might lose your assets.',
      [BlockaidReason.transferFromFarming]:
        'If you approve this request, a third party known for scams will take all your assets.',
      [BlockaidReason.transferFarming]:
        'If you approve this request, a third party known for scams will take all your assets.',
    }).forEach(([reason, expectedDescription]) => {
      it(`should render for '${reason}' correctly`, () => {
        const { getByText } = renderWithProvider(
          <BlockaidBannerAlert
            txData={{
              securityAlertResponse: {
                ...mockSecurityAlertResponse,
                reason,
              },
            }}
          />,
          configureStore(),
        );

        expect(getByText(expectedDescription)).toBeInTheDocument();
      });
    });
  });

  describe('when reason does not map to a description', () => {
    it('renders the "other" description translation and logs a Sentry exception', () => {
      const stubOtherDescription =
        'If you approve this request, you might lose your assets.';
      const { getByText } = renderWithProvider(
        <BlockaidBannerAlert
          txData={{
            securityAlertResponse: {
              ...mockSecurityAlertResponse,
              reason: 'unmappedReason',
            },
          }}
        />,
        configureStore(),
      );

      expect(getByText(stubOtherDescription)).toBeInTheDocument();
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });
  });

  describe('when clicking "See details" > "Report an issue"', () => {
    it('calls updateTransactionEventFragment to add "external_link_clicked" prop to metric', () => {
      const stubScrollIntoView = jest.fn();
      const originalScrollIntoView =
        window.HTMLElement.prototype.scrollIntoView;
      window.HTMLElement.prototype.scrollIntoView = stubScrollIntoView;

      renderWithProvider(
        <BlockaidBannerAlert
          txData={{
            id: '1',
            securityAlertResponse: {
              ...mockSecurityAlertResponse,
              reason: 'unmappedReason',
            },
          }}
        />,
        configureStore(),
      );

      fireEvent.click(screen.queryByText('See details'));
      fireEvent.click(screen.queryByText('Report an issue'));

      expect(mockUpdateTransactionEventFragment).toHaveBeenCalledTimes(1);
      expect(mockUpdateTransactionEventFragment).toHaveBeenCalledWith(
        {
          properties: {
            external_link_clicked: 'security_alert_support_link',
          },
        },
        '1',
      );
      window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    });
  });
});
