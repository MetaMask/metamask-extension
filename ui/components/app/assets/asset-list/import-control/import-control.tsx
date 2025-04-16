import React from 'react';
import { useSelector } from 'react-redux';
import {
  ButtonBase,
  ButtonBaseSize,
  IconName,
} from '../../../../component-library';
import {
  BackgroundColor,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { getMultichainIsEvm } from '../../../../../selectors/multichain';

type AssetListControlBarProps = {
  showNftLinks?: boolean;
  showTokensLinks?: boolean;
  onClick?: () => void;
};

const AssetListControlBar = ({
  showNftLinks,
  showTokensLinks,
  onClick,
}: AssetListControlBarProps) => {
  const isEvm = useSelector(getMultichainIsEvm);
  // NOTE: Since we can parametrize it now, we keep the original behavior
  // for EVM assets
  const shouldShowNftLinks = showNftLinks ?? isEvm;
  const shouldShowTokensLinks = showTokensLinks ?? isEvm;

  if (shouldShowNftLinks) {
    return (
      <ButtonBase
        className="asset-list-control-bar__button"
        data-testid="asset-list-control-bar-action-button"
        disabled={false}
        size={ButtonBaseSize.Sm}
        startIconName={IconName.MoreVertical}
        startIconProps={{ marginInlineEnd: 0 }}
        backgroundColor={BackgroundColor.backgroundDefault}
        color={TextColor.textDefault}
        onClick={onClick}
      />
    );
  }

  if (showTokensLinks) {
    return (
      <ButtonBase
        className="asset-list-control-bar__button"
        data-testid="asset-list-control-bar-action-button"
        disabled={!shouldShowTokensLinks}
        size={ButtonBaseSize.Sm}
        startIconName={IconName.MoreVertical}
        startIconProps={{ marginInlineEnd: 0 }}
        backgroundColor={BackgroundColor.backgroundDefault}
        color={TextColor.textDefault}
        onClick={onClick}
      />
    );
  }

  // fallback
  return null;
};

export default AssetListControlBar;
