import React from 'react';
import {
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { type BridgeToken } from '../../../../../ducks/bridge/types';
import {
  IconSize as IconSizeLegacy,
  Tag,
} from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  BackgroundColor,
  FontWeight,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { useAssetSecurityData } from '../../../hooks/useAssetSecurityData';

type AssetBannerProps = {
  asset: BridgeToken;
};

export const AssetBanner = ({ asset }: AssetBannerProps) => {
  const t = useI18nContext();
  const { assetIsVerified, assetIsSuspicious, assetIsMalicious } =
    useAssetSecurityData(asset);

  if (assetIsVerified) {
    return (
      <Icon
        data-testid="bridge-asset-verified-badge"
        name={IconName.VerifiedFilled}
        size={IconSize.Sm}
        color={IconColor.InfoDefault}
      />
    );
  }

  if (assetIsSuspicious) {
    return (
      <Tag
        label={t('bridgeSuspicious')}
        iconName={IconName.Danger}
        backgroundColor={BackgroundColor.warningMuted}
        labelProps={{
          color: TextColor.warningDefault,
          fontWeight: FontWeight.Medium,
        }}
        startIconProps={{
          className: 'text-warning-default',
          size: IconSizeLegacy.Sm,
        }}
      />
    );
  }

  if (assetIsMalicious) {
    return (
      <Tag
        label={t('bridgeMalicious')}
        iconName={IconName.Error}
        backgroundColor={BackgroundColor.errorMuted}
        labelProps={{
          color: TextColor.errorDefault,
          fontWeight: FontWeight.Medium,
        }}
        startIconProps={{
          className: 'text-error-default',
          size: IconSizeLegacy.Sm,
        }}
      />
    );
  }

  return null;
};
