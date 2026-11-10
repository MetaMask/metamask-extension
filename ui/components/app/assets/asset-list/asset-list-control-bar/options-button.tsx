import React, { forwardRef } from 'react';
import { useSelector } from 'react-redux';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { getMultichainIsEvm } from '../../../../../selectors/multichain';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

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
        className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent hover:bg-hover active:bg-pressed"
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
