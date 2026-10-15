import React from 'react';
import { render } from '@testing-library/react';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { enLocale as en } from '../../../../test/lib/i18n-helpers';
import { toBridgeToken } from '../../../ducks/bridge/utils';
import { BridgeAssetSecurityDataType } from '../utils/tokens';
import { AssetSecurityBadge } from './asset-security-badge';

jest.mock('../../../hooks/useI18nContext', () => {
  const { enLocale: mockEnLocale } = jest.requireActual(
    '../../../../test/lib/i18n-helpers',
  );
  return {
    useI18nContext: () => (key: string) =>
      mockEnLocale[key as keyof typeof mockEnLocale]?.message ?? key,
  };
});

const BASE_ASSET = toBridgeToken(getNativeAssetForChainId('0x1'));

const renderAssetSecurityBadge = (
  asset: Parameters<typeof AssetSecurityBadge>[0]['asset'],
) => render(<AssetSecurityBadge asset={asset} />);

describe('AssetSecurityBadge', () => {
  describe('verified icon', () => {
    it('renders verified badge when isVerified is true', () => {
      const { getByTestId } = renderAssetSecurityBadge({
        ...BASE_ASSET,
        isVerified: true,
      });
      expect(getByTestId('security-badge')).toBeInTheDocument();
    });

    it('does not render verified badge when isVerified is false', () => {
      const { queryByTestId } = renderAssetSecurityBadge({
        ...BASE_ASSET,
        isVerified: false,
      });
      expect(queryByTestId('security-badge')).not.toBeInTheDocument();
    });

    it('renders verified badge when securityData.type is VERIFIED', () => {
      const { getByTestId } = renderAssetSecurityBadge({
        ...BASE_ASSET,
        securityData: { type: BridgeAssetSecurityDataType.VERIFIED },
      });
      expect(getByTestId('security-badge')).toBeInTheDocument();
    });
  });

  describe('risky tag', () => {
    it('renders Risky tag when securityData.type is WARNING', () => {
      const { getByText, getByTestId } = renderAssetSecurityBadge({
        ...BASE_ASSET,
        securityData: { type: BridgeAssetSecurityDataType.WARNING },
      });
      expect(getByText(en.securityTrustRisky.message)).toBeInTheDocument();
      expect(getByTestId('security-badge')).toBeInTheDocument();
    });

    it('renders Risky tag when securityData.type is SPAM', () => {
      const { getByText } = renderAssetSecurityBadge({
        ...BASE_ASSET,
        securityData: { type: BridgeAssetSecurityDataType.SPAM },
      });
      expect(getByText(en.securityTrustRisky.message)).toBeInTheDocument();
    });

    it('renders verified badge when isVerified is true even if securityData.type is SPAM', () => {
      const { getByTestId, queryByText } = renderAssetSecurityBadge({
        ...BASE_ASSET,
        isVerified: true,
        securityData: { type: BridgeAssetSecurityDataType.SPAM },
      });
      expect(getByTestId('security-badge')).toBeInTheDocument();
      expect(
        queryByText(en.securityTrustRisky.message),
      ).not.toBeInTheDocument();
    });
  });

  describe('malicious tag', () => {
    it('renders Malicious tag when securityData.type is MALICIOUS', () => {
      const { getByText } = renderAssetSecurityBadge({
        ...BASE_ASSET,
        securityData: { type: BridgeAssetSecurityDataType.MALICIOUS },
      });
      expect(getByText(en.securityTrustMalicious.message)).toBeInTheDocument();
    });

    it('renders verified badge when isVerified is true even if securityData.type is MALICIOUS', () => {
      const { getByTestId, queryByText } = renderAssetSecurityBadge({
        ...BASE_ASSET,
        isVerified: true,
        securityData: { type: BridgeAssetSecurityDataType.MALICIOUS },
      });
      expect(getByTestId('security-badge')).toBeInTheDocument();
      expect(
        queryByText(en.securityTrustMalicious.message),
      ).not.toBeInTheDocument();
    });
  });

  describe('null cases', () => {
    it('renders nothing when securityData.type is INFO', () => {
      const { queryByTestId } = renderAssetSecurityBadge({
        ...BASE_ASSET,
        securityData: { type: BridgeAssetSecurityDataType.INFO },
      });
      expect(queryByTestId('security-badge')).not.toBeInTheDocument();
    });

    it('renders nothing when securityData.type is BENIGN', () => {
      const { queryByTestId } = renderAssetSecurityBadge({
        ...BASE_ASSET,
        securityData: { type: BridgeAssetSecurityDataType.BENIGN },
      });
      expect(queryByTestId('security-badge')).not.toBeInTheDocument();
    });

    it('renders nothing when no securityData and isVerified is absent', () => {
      const { queryByTestId } = renderAssetSecurityBadge(BASE_ASSET);
      expect(queryByTestId('security-badge')).not.toBeInTheDocument();
    });
  });
});
