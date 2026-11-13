import React, { forwardRef } from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { assetControlIconButtonClassName } from './asset-controls';

type OptionsButtonProps = {
  onClick?: () => void;
};

/**
 * More button that opens an asset options menu.
 *
 * @param props - The component props.
 * @param props.onClick - Called when the button is pressed.
 * @param ref - The button element, used to position the menu.
 */
export const OptionsButton = forwardRef<HTMLButtonElement, OptionsButtonProps>(
  ({ onClick }, ref) => {
    const t = useI18nContext();

    return (
      <ButtonIcon
        ref={ref}
        className={assetControlIconButtonClassName}
        data-testid="asset-list-control-bar-action-button"
        size={ButtonIconSize.Sm}
        iconName={IconName.MoreVertical}
        ariaLabel={t('assetOptions')}
        onClick={onClick}
      />
    );
  },
);

OptionsButton.displayName = 'OptionsButton';
