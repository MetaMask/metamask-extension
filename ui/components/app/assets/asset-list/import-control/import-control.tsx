import React, { forwardRef } from 'react';
import { useSelector } from 'react-redux';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { getMultichainIsEvm } from '../../../../../selectors/multichain';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

type ImportControlProps = {
  showTokensLinks?: boolean;
  onClick?: () => void;
};

const ImportControl = forwardRef<HTMLButtonElement, ImportControlProps>(
  ({ showTokensLinks, onClick }, ref) => {
    const t = useI18nContext();
    const isEvm = useSelector(getMultichainIsEvm);
    // NOTE: Since we can parametrize it now, we keep the original behavior
    // for EVM assets
    const shouldShowTokensLinks = showTokensLinks ?? isEvm;

    return (
      <ButtonIcon
        ref={ref}
        className="asset-list-control-bar__button flex items-center justify-center border-0 bg-transparent hover:bg-hover active:bg-pressed"
        data-testid="asset-list-control-bar-action-button"
        disabled={!shouldShowTokensLinks}
        size={ButtonIconSize.Sm}
        iconName={IconName.MoreVertical}
        ariaLabel={t('assetOptions')}
        onClick={onClick}
      />
    );
  },
);

ImportControl.displayName = 'ImportControl';

export default ImportControl;
