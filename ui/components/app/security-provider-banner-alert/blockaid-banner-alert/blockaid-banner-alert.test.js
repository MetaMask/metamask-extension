import React from 'react';
import * as Sentry from '@sentry/browser';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers';
import { Severity } from '../../../../helpers/constants/design-system';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../../shared/constants/security-provider';
import BlockaidBannerAlert from '.';

jest.mock('@sentry/browser');
jest.mock('zlib', () => ({
  gzipSync: (val) => val,
}));

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
    const { container } = renderWithLocalization(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: undefined,
        }}
      />,
    );

    expect(container.querySelector('.mm-banner-alert')).toBeNull();
  });

  it(`should not render when securityAlertResponse.result_type is '${BlockaidResultType.Benign}'`, () => {
    const { container } = renderWithLocalization(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: {
            ...mockSecurityAlertResponse,
            result_type: BlockaidResultType.Benign,
          },
        }}
      />,
    );

    expect(container.querySelector('.mm-banner-alert')).toBeNull();
  });

  it(`should render '${Severity.Warning}' UI when securityAlertResponse.result_type is '${BlockaidResultType.Failed}`, () => {
    const { container } = renderWithLocalization(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: {
            ...mockSecurityAlertResponse,
            result_type: BlockaidResultType.Failed,
          },
        }}
      />,
    );
    const warningBannerAlert = container.querySelector(
      '.mm-banner-alert--severity-warning',
    );

    expect(warningBannerAlert).toBeInTheDocument();
    expect(warningBannerAlert).toMatchSnapshot();
  });

  it(`should render '${Severity.Warning}' UI when securityAlertResponse.result_type is '${BlockaidResultType.Warning}`, () => {
    const { container } = renderWithLocalization(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: mockSecurityAlertResponse,
        }}
      />,
    );
    const warningBannerAlert = container.querySelector(
      '.mm-banner-alert--severity-warning',
    );

    expect(warningBannerAlert).toBeInTheDocument();
    expect(warningBannerAlert).toMatchSnapshot();
  });

  it(`should render '${Severity.Danger}' UI when securityAlertResponse.result_type is '${BlockaidResultType.Malicious}`, () => {
    const { container } = renderWithLocalization(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: {
            ...mockSecurityAlertResponse,
            result_type: BlockaidResultType.Malicious,
          },
        }}
      />,
    );
    const dangerBannerAlert = container.querySelector(
      '.mm-banner-alert--severity-danger',
    );

    expect(dangerBannerAlert).toBeInTheDocument();
    expect(dangerBannerAlert).toMatchSnapshot();
  });

  it('should render title, "This is a deceptive request"', () => {
    const { getByText } = renderWithLocalization(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: mockSecurityAlertResponse,
        }}
      />,
    );

    expect(getByText('This is a deceptive request')).toBeInTheDocument();
  });

  it(`should render title, "This is a suspicious request", when the reason is "${BlockaidReason.failed}"`, () => {
    const { getByText } = renderWithLocalization(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: {
            ...mockSecurityAlertResponse,
            reason: BlockaidReason.failed,
          },
        }}
      />,
    );

    expect(getByText('Request may not be safe')).toBeInTheDocument();
  });

  it(`should render title, "This is a suspicious request", when the reason is "${BlockaidReason.rawSignatureFarming}"`, () => {
    const { getByText } = renderWithLocalization(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: {
            ...mockSecurityAlertResponse,
            reason: BlockaidReason.rawSignatureFarming,
          },
        }}
      />,
    );

    expect(getByText('This is a suspicious request')).toBeInTheDocument();
  });

  it('should render details when provided', () => {
    const mockFeatures = [
      'Operator is an EOA',
      'Operator is untrusted according to previous activity',
    ];

    const { container, getByText } = renderWithLocalization(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: {
            ...mockSecurityAlertResponse,
            features: mockFeatures,
          },
        }}
      />,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.disclosure')).toBeInTheDocument();
    mockFeatures.forEach((feature) => {
      expect(getByText(`• ${feature}`)).toBeInTheDocument();
    });
  });

  it('should render details section even when features is not provided', () => {
    const { container } = renderWithLocalization(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: mockSecurityAlertResponse,
          features: undefined,
        }}
      />,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.disclosure')).toBeInTheDocument();
  });

  it('should render link to report url', () => {
    const { container, getByText, getByRole } = renderWithLocalization(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: mockSecurityAlertResponse,
          features: undefined,
        }}
      />,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.disclosure')).toBeInTheDocument();
    expect(getByText("Something doesn't look right?")).toBeInTheDocument();
    expect(getByText('Report an issue')).toBeInTheDocument();
    expect(getByRole('link', { name: 'Report an issue' })).toBeInTheDocument();
  });

  it('should pass required data in Report an issue URL', () => {
    const { getByRole } = renderWithLocalization(
      <BlockaidBannerAlert
        txData={{
          securityAlertResponse: mockSecurityAlertResponse,
          features: undefined,
        }}
      />,
    );

    const elm = getByRole('link', { name: 'Report an issue' });
    expect(elm.href).toBe(
      'https://blockaid-false-positive-portal.metamask.io/?data=%7B%22classification%22%3A%22set_approval_for_all%22%2C%22blockaidVersion%22%3A%221.4.0%22%2C%22resultType%22%3A%22Warning%22%7D&utm_source=metamask-ppom',
    );
  });

  describe('when rendering description', () => {
    Object.entries({
      [BlockaidReason.approvalFarming]:
        'If you approve this request, a third party known for scams might take all your assets.',
      [BlockaidReason.blurFarming]:
        'If you approve this request, someone can steal your assets listed on Blur.',
      [BlockaidReason.failed]:
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
        const { getByText } = renderWithLocalization(
          <BlockaidBannerAlert
            txData={{
              securityAlertResponse: {
                ...mockSecurityAlertResponse,
                reason,
              },
            }}
          />,
        );

        expect(getByText(expectedDescription)).toBeInTheDocument();
      });
    });
  });

  describe('when reason does not map to a description', () => {
    it('renders the "other" description translation and logs a Sentry exception', () => {
      const stubOtherDescription =
        'If you approve this request, you might lose your assets.';
      const { getByText } = renderWithLocalization(
        <BlockaidBannerAlert
          txData={{
            securityAlertResponse: {
              ...mockSecurityAlertResponse,
              reason: 'unmappedReason',
            },
          }}
        />,
      );

      expect(getByText(stubOtherDescription)).toBeInTheDocument();
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });
  });
});
