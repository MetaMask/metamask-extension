import React from 'react';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import {
  en,
  renderWithLocalization,
} from '../../../../../../test/lib/render-helpers-navigate';
import { toBridgeToken } from '../../../../../ducks/bridge/utils';
import { BridgeAssetSecurityDataType } from '../../../utils/tokens';
import { AssetBanner } from './asset-banner';

const BASE_ASSET = toBridgeToken(getNativeAssetForChainId('0x1'));

describe('AssetBanner', () => {
  describe('verified icon', () => {
    it('renders verified badge when isVerified is true', () => {
      const { getByTestId } = renderWithLocalization(
        <AssetBanner asset={{ ...BASE_ASSET, isVerified: true }} />,
      );
      expect(getByTestId('bridge-asset-verified-badge')).toBeInTheDocument();
    });

    it('does not render verified badge when isVerified is false', () => {
      const { queryByTestId } = renderWithLocalization(
        <AssetBanner asset={{ ...BASE_ASSET, isVerified: false }} />,
      );
      expect(
        queryByTestId('bridge-asset-verified-badge'),
      ).not.toBeInTheDocument();
    });

    it('does not render verified badge when isVerified is absent', () => {
      const { queryByTestId } = renderWithLocalization(
        <AssetBanner asset={BASE_ASSET} />,
      );
      expect(
        queryByTestId('bridge-asset-verified-badge'),
      ).not.toBeInTheDocument();
    });

    it('renders verified badge when securityData.type is VERIFIED', () => {
      const { getByTestId } = renderWithLocalization(
        <AssetBanner
          asset={{
            ...BASE_ASSET,
            securityData: { type: BridgeAssetSecurityDataType.VERIFIED },
          }}
        />,
      );
      expect(getByTestId('bridge-asset-verified-badge')).toBeInTheDocument();
    });

    it('renders verified badge when securityData.type is VERIFIED even if isVerified is false', () => {
      const { getByTestId } = renderWithLocalization(
        <AssetBanner
          asset={{
            ...BASE_ASSET,
            isVerified: false,
            securityData: { type: BridgeAssetSecurityDataType.VERIFIED },
          }}
        />,
      );
      expect(getByTestId('bridge-asset-verified-badge')).toBeInTheDocument();
    });

    it('renders verified badge via isVerified fallback when securityData.type is not VERIFIED', () => {
      const { getByTestId } = renderWithLocalization(
        <AssetBanner
          asset={{
            ...BASE_ASSET,
            isVerified: true,
            securityData: { type: BridgeAssetSecurityDataType.WARNING },
          }}
        />,
      );
      expect(getByTestId('bridge-asset-verified-badge')).toBeInTheDocument();
    });
  });

  describe('suspicious tag', () => {
    it('renders Suspicious tag when securityData.type is WARNING', () => {
      const { getByText, queryByTestId } = renderWithLocalization(
        <AssetBanner
          asset={{
            ...BASE_ASSET,
            securityData: { type: BridgeAssetSecurityDataType.WARNING },
          }}
        />,
      );
      expect(getByText(en.bridgeSuspicious.message)).toBeInTheDocument();
      expect(
        queryByTestId('bridge-asset-verified-badge'),
      ).not.toBeInTheDocument();
    });

    it('renders Suspicious tag when securityData.type is SPAM', () => {
      const { getByText, queryByTestId } = renderWithLocalization(
        <AssetBanner
          asset={{
            ...BASE_ASSET,
            securityData: { type: BridgeAssetSecurityDataType.SPAM },
          }}
        />,
      );
      expect(getByText(en.bridgeSuspicious.message)).toBeInTheDocument();
      expect(
        queryByTestId('bridge-asset-verified-badge'),
      ).not.toBeInTheDocument();
    });

    it('does not render Suspicious tag when securityData.type is SPAM but isVerified is true', () => {
      const { getByTestId, queryByText } = renderWithLocalization(
        <AssetBanner
          asset={{
            ...BASE_ASSET,
            isVerified: true,
            securityData: { type: BridgeAssetSecurityDataType.SPAM },
          }}
        />,
      );
      expect(getByTestId('bridge-asset-verified-badge')).toBeInTheDocument();
      expect(queryByText(en.bridgeSuspicious.message)).not.toBeInTheDocument();
    });
  });

  describe('malicious tag', () => {
    it('renders Malicious tag when securityData.type is MALICIOUS', () => {
      const { getByText, queryByTestId } = renderWithLocalization(
        <AssetBanner
          asset={{
            ...BASE_ASSET,
            securityData: { type: BridgeAssetSecurityDataType.MALICIOUS },
          }}
        />,
      );
      expect(getByText(en.bridgeMalicious.message)).toBeInTheDocument();
      expect(
        queryByTestId('bridge-asset-verified-badge'),
      ).not.toBeInTheDocument();
    });

    it('does not render Malicious tag when securityData.type is MALICIOUS but isVerified is true', () => {
      const { getByTestId, queryByText } = renderWithLocalization(
        <AssetBanner
          asset={{
            ...BASE_ASSET,
            isVerified: true,
            securityData: { type: BridgeAssetSecurityDataType.MALICIOUS },
          }}
        />,
      );
      expect(getByTestId('bridge-asset-verified-badge')).toBeInTheDocument();
      expect(queryByText(en.bridgeMalicious.message)).not.toBeInTheDocument();
    });
  });

  describe('null cases', () => {
    it('renders nothing when securityData.type is INFO', () => {
      const { queryByTestId, queryByText } = renderWithLocalization(
        <AssetBanner
          asset={{
            ...BASE_ASSET,
            securityData: { type: BridgeAssetSecurityDataType.INFO },
          }}
        />,
      );
      expect(
        queryByTestId('bridge-asset-verified-badge'),
      ).not.toBeInTheDocument();
      expect(queryByText(en.bridgeSuspicious.message)).not.toBeInTheDocument();
      expect(queryByText(en.bridgeMalicious.message)).not.toBeInTheDocument();
    });

    it('renders nothing when securityData.type is BENIGN', () => {
      const { queryByTestId, queryByText } = renderWithLocalization(
        <AssetBanner
          asset={{
            ...BASE_ASSET,
            securityData: { type: BridgeAssetSecurityDataType.BENIGN },
          }}
        />,
      );
      expect(
        queryByTestId('bridge-asset-verified-badge'),
      ).not.toBeInTheDocument();
      expect(queryByText(en.bridgeSuspicious.message)).not.toBeInTheDocument();
      expect(queryByText(en.bridgeMalicious.message)).not.toBeInTheDocument();
    });

    it('renders nothing when no securityData and isVerified is absent', () => {
      const { queryByTestId, queryByText } = renderWithLocalization(
        <AssetBanner asset={BASE_ASSET} />,
      );
      expect(
        queryByTestId('bridge-asset-verified-badge'),
      ).not.toBeInTheDocument();
      expect(queryByText(en.bridgeSuspicious.message)).not.toBeInTheDocument();
      expect(queryByText(en.bridgeMalicious.message)).not.toBeInTheDocument();
    });
  });
});
