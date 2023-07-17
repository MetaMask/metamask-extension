import React from 'react';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers';
import { Severity } from '../../../../helpers/constants/design-system';
import { BlockaidResultType } from '../../../../../shared/constants/security-provider';
import BlockaidBannerAlert from '.';

const mockPpomResponse = {
  resultType: BlockaidResultType.Warning,
  reason: 'set_approval_for_all',
  description:
    'A SetApprovalForAll request was made on {contract}. We found the operator {operator} to be malicious',
  args: {
    contract: '0xa7206d878c5c3871826dfdb42191c49b1d11f466',
    operator: '0x92a3b9773b1763efa556f55ccbeb20441962d9b2',
  },
};

describe('Blockaid Banner Alert', () => {
  it(`should not render when ppomResponse.resultType is '${BlockaidResultType.Benign}'`, () => {
    const { container } = renderWithLocalization(
      <BlockaidBannerAlert
        ppomResponse={{
          ...mockPpomResponse,
          resultType: BlockaidResultType.Benign,
        }}
      />,
    );

    expect(container.querySelector('.mm-banner-alert')).toBeNull();
  });

  it(`should render '${Severity.Danger}' UI when ppomResponse.resultType is '${BlockaidResultType.Malicious}`, () => {
    const { container } = renderWithLocalization(
      <BlockaidBannerAlert
        ppomResponse={{
          ...mockPpomResponse,
          resultType: BlockaidResultType.Malicious,
        }}
      />,
    );
    const dangerBannerAlert = container.querySelector(
      '.mm-banner-alert--severity-danger',
    );

    expect(dangerBannerAlert).toBeInTheDocument();
    expect(dangerBannerAlert).toMatchSnapshot();
  });

  it(`should render '${Severity.Warning}' UI when ppomResponse.resultType is '${BlockaidResultType.Warning}`, () => {
    const { container } = renderWithLocalization(
      <BlockaidBannerAlert ppomResponse={mockPpomResponse} />,
    );
    const warningBannerAlert = container.querySelector(
      '.mm-banner-alert--severity-warning',
    );

    expect(warningBannerAlert).toBeInTheDocument();
    expect(warningBannerAlert).toMatchSnapshot();
  });

  it('should render title, "This is a deceptive request"', () => {
    const { getByText } = renderWithLocalization(
      <BlockaidBannerAlert ppomResponse={mockPpomResponse} />,
    );

    expect(getByText('This is a deceptive request')).toBeInTheDocument();
  });

  it('should render title, "This is a suspicious request", when the reason is "signature_farming"', () => {
    const { getByText } = renderWithLocalization(
      <BlockaidBannerAlert
        ppomResponse={{ ...mockPpomResponse, reason: 'signature_farming' }}
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
        ppomResponse={{ ...mockPpomResponse, features: mockFeatures }}
      />,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.disclosure')).toBeInTheDocument();
    mockFeatures.forEach((feature) => {
      expect(getByText(`• ${feature}`)).toBeInTheDocument();
    });
  });

  describe('when rendering description', () => {
    Object.entries({
      approval_farming:
        'If you approve this request, a third party known for scams might take all your assets.',
      blur_farming:
        'If you approve this request, someone can steal your assets listed on Blur.',
      malicious_domain:
        "You're interacting with a malicious domain. If you approve this request, you might lose your assets.",
      other: 'If you approve this request, you might lose your assets.',
      permit_farming:
        'If you approve this request, a third party known for scams might take all your assets.',
      raw_native_token_transfer:
        'If you approve this request, a third party known for scams will take all your assets.',
      seaport_farming:
        'If you approve this request, someone can steal your assets listed on OpenSea.',
      set_approval_for_all:
        'If you approve this request, a third party known for scams might take all your assets.',
      signature_farming:
        'If you approve this request, you might lose your assets.',
      trade_order_farming:
        'If you approve this request, you might lose your assets.',
      transfer_from_farming:
        'If you approve this request, a third party known for scams will take all your assets.',
      transfer_farming:
        'If you approve this request, a third party known for scams will take all your assets.',
      unfair_trade: 'If you approve this request, you might lose your assets.',
    }).forEach(([reason, expectedDescription]) => {
      it(`should render for '${reason}' correctly`, () => {
        const { getByText } = renderWithLocalization(
          <BlockaidBannerAlert
            ppomResponse={{ ...mockPpomResponse, reason }}
          />,
        );

        expect(getByText(expectedDescription)).toBeInTheDocument();
      });
    });
  });
});
