import React from 'react';
import { useSelector } from 'react-redux';
import {
  Popover,
  SelectButton,
  SelectButtonEndArrow,
  SelectButtonSize,
  SelectButtonVariant,
  twMerge,
} from '@metamask/design-system-react';
import { getTokenSortConfig } from '../../../../../selectors';
import SortControl from '../sort-control/sort-control';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useControlPopover } from './use-control-popover';

/**
 * Sort button and the sort popover. Writes the shared `tokenSortConfig`.
 * The trailing arrow reflects the order in force instead of a dropdown
 * chevron, matching the MMDS SelectButton sort pattern.
 */
export const SortByButton = () => {
  const t = useI18nContext();
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const { buttonRef, isOpen, toggle, close, popoverProps } =
    useControlPopover('250px');

  return (
    <>
      <SelectButton
        ref={buttonRef}
        data-testid="sort-by-popover-toggle"
        className={twMerge(isOpen && 'bg-pressed')}
        onClick={toggle}
        size={SelectButtonSize.Sm}
        variant={SelectButtonVariant.Secondary}
        value={t('sortBy')}
        placeholder=""
        endArrowDirection={
          tokenSortConfig?.order === 'asc'
            ? SelectButtonEndArrow.Up
            : SelectButtonEndArrow.Down
        }
        endArrowDirectionIconProps={{
          'data-testid': 'sort-by-direction-arrow',
        }}
        textProps={{ className: 'whitespace-nowrap' }}
      />
      <Popover {...popoverProps}>
        <SortControl handleClose={close} />
      </Popover>
    </>
  );
};
