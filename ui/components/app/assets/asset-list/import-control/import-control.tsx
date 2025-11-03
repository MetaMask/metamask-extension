import React from 'react';
import {
  ButtonBase,
  ButtonBaseSize,
  IconName,
  IconSize,
} from '../../../../component-library';
import {
  BackgroundColor,
  TextColor,
} from '../../../../../helpers/constants/design-system';

type AssetListControlBarProps = {
  showTokensLinks?: boolean;
  onClick?: () => void;
};

const AssetListControlBar = ({
  showTokensLinks,
  onClick,
}: AssetListControlBarProps) => (
  <ButtonBase
    className="asset-list-control-bar__button"
    data-testid="asset-list-control-bar-action-button"
    disabled={!showTokensLinks}
    size={ButtonBaseSize.Sm}
    startIconName={IconName.MoreVertical}
    startIconProps={{ marginInlineEnd: 0, size: IconSize.Md }}
    backgroundColor={BackgroundColor.backgroundDefault}
    color={TextColor.textDefault}
    onClick={onClick}
  />
);

export default AssetListControlBar;
