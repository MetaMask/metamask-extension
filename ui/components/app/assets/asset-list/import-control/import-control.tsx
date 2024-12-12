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
  showTokensLinks?: boolean;
  onClick?: () => void;
};

const AssetListControlBar = ({
  showTokensLinks,
  onClick,
}: AssetListControlBarProps) => {
  const isEvm = useSelector(getMultichainIsEvm);
  // NOTE: Since we can parametrize it now, we keep the original behavior
  // for EVM assets
  const shouldShowTokensLinks = showTokensLinks ?? isEvm;

  return (
    <ButtonBase
      className="asset-list-control-bar__button"
      data-testid="import-token-button"
      disabled={!shouldShowTokensLinks}
      size={ButtonBaseSize.Sm}
      startIconName={IconName.MoreVertical}
      startIconProps={{ marginInlineEnd: 0 }}
      backgroundColor={BackgroundColor.backgroundDefault}
      color={TextColor.textDefault}
      onClick={onClick}
    />
  );
};

export default AssetListControlBar;
