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
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import { getCurrencySymbol } from '../../../../../helpers/utils/common.util';
import SortControl from '../sort-control/sort-control';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useControlPopover } from './use-control-popover';

/**
 * Sort button and the sort popover. Writes the shared `tokenSortConfig`.
 * The label is the sort in force and the trailing arrow reflects its order
 * instead of a dropdown chevron, matching the MMDS SelectButton sort pattern.
 * The accessible name carries purpose, value and direction, e.g.
 * "Sort by, Declining balance ($ high-low), sorted descending".
 */
export const SortByButton = () => {
  const t = useI18nContext();
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const currentCurrency = useSelector(getCurrentCurrency);
  const { buttonRef, isOpen, toggle, close, popoverProps } =
    useControlPopover('250px');

  // The sort popover only offers these two options, so anything that is not
  // the alphabetical option is the (default) fiat-balance one.
  const isAlphabeticalSort =
    tokenSortConfig?.key === 'name' || tokenSortConfig?.key === 'title';
  const isAscendingOrder = tokenSortConfig?.order === 'asc';
  const sortOptionLabel = isAlphabeticalSort
    ? t('sortByAlphabetically')
    : t('sortByDecliningBalance', [getCurrencySymbol(currentCurrency)]);
  const accessibleName = `${t('sortBy')}, ${sortOptionLabel}, ${
    isAscendingOrder ? t('sortedAscending') : t('sortedDescending')
  }`;

  return (
    <>
      <SelectButton
        ref={buttonRef}
        data-testid="sort-by-popover-toggle"
        aria-label={accessibleName}
        className={twMerge(isOpen && 'bg-pressed')}
        onClick={toggle}
        size={SelectButtonSize.Sm}
        variant={SelectButtonVariant.Secondary}
        value={sortOptionLabel}
        placeholder=""
        endArrowDirection={
          isAscendingOrder ? SelectButtonEndArrow.Up : SelectButtonEndArrow.Down
        }
        endArrowDirectionIconProps={{
          'data-testid': 'sort-by-direction-arrow',
        }}
        textProps={{ className: 'min-w-0 truncate' }}
      />
      <Popover {...popoverProps}>
        <SortControl handleClose={close} />
      </Popover>
    </>
  );
};
