import React, { forwardRef } from 'react';
import { useSelector } from 'react-redux';
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
import { getMultichainIsEvm } from '../../../../../selectors/multichain';

type ImportControlProps = {
  showTokensLinks?: boolean;
  onClick?: () => void;
};

const ImportControl = forwardRef<HTMLButtonElement, ImportControlProps>(
  ({ showTokensLinks, onClick }, ref) => {
    const isEvm = useSelector(getMultichainIsEvm);
    // NOTE: Since we can parametrize it now, we keep the original behavior
    // for EVM assets
    const shouldShowTokensLinks = showTokensLinks ?? isEvm;

    return (
      <ButtonBase
        ref={ref}
        className="asset-list-control-bar__button"
        data-testid="asset-list-control-bar-action-button"
        disabled={!shouldShowTokensLinks}
        size={ButtonBaseSize.Sm}
        startIconName={IconName.MoreVertical}
        startIconProps={{ marginInlineEnd: 0, size: IconSize.Md }}
        backgroundColor={BackgroundColor.backgroundDefault}
        color={TextColor.textDefault}
        onClick={onClick}
      />
    );
  },
);

ImportControl.displayName = 'ImportControl';

export default ImportControl;
