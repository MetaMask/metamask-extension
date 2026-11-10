import React, { forwardRef } from 'react';
import { useSelector } from 'react-redux';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { getMultichainIsEvm } from '../../../../../selectors/multichain';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { assetControlIconButtonClassName } from './asset-controls';

type OptionsButtonProps = {
  showTokensLinks?: boolean;
  onClick?: () => void;
};

/**
 * More button that opens an asset options menu.
 *
 * @param props - The component props.
 * @param props.showTokensLinks - Enables the button. Defaults to whether the account is EVM.
 * @param props.onClick - Called when the button is pressed.
 * @param ref - The button element, used to position the menu.
 */
export const OptionsButton = forwardRef<HTMLButtonElement, OptionsButtonProps>(
  ({ showTokensLinks, onClick }, ref) => {
    const t = useI18nContext();
    const isEvm = useSelector(getMultichainIsEvm);
    // NOTE: Since we can parametrize it now, we keep the original behavior
    // for EVM assets
    const shouldShowTokensLinks = showTokensLinks ?? isEvm;

    return (
      <ButtonIcon
        ref={ref}
        className={assetControlIconButtonClassName}
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

OptionsButton.displayName = 'OptionsButton';
