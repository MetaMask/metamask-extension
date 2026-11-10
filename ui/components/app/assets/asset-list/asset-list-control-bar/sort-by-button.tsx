import React from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  twMerge,
} from '@metamask/design-system-react';
import { Popover } from '../../../../component-library';
import SortControl from '../sort-control/sort-control';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import Tooltip from '../../../../ui/tooltip';
import { assetControlIconButtonClassName } from './asset-controls';
import { useControlPopover } from './use-control-popover';

/**
 * Sort button and the sort popover. Writes the shared `tokenSortConfig`.
 */
export const SortByButton = () => {
  const t = useI18nContext();
  const { buttonRef, isOpen, toggle, close, popoverProps } =
    useControlPopover('250px');

  return (
    <>
      <Tooltip
        title={t('sortBy')}
        position="bottom"
        distance={20}
        disabled={isOpen}
      >
        <ButtonIcon
          ref={buttonRef}
          data-testid="sort-by-popover-toggle"
          className={twMerge(
            assetControlIconButtonClassName,
            isOpen && 'bg-pressed',
          )}
          onClick={toggle}
          size={ButtonIconSize.Sm}
          iconName={IconName.ListArrow}
          ariaLabel={t('sortBy')}
        />
      </Tooltip>
      <Popover {...popoverProps}>
        <SortControl handleClose={close} />
      </Popover>
    </>
  );
};
