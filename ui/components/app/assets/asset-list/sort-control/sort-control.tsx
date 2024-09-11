import React, { useState } from 'react';
import { Box } from '../../../../component-library';
import { TokenWithBalance } from '../asset-list';
import { SortOrder, sortAssets } from '../../util/sort';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { ReactNode } from 'react-markdown';
import classnames from 'classnames';

type SortControlProps = {
  tokenList: TokenWithBalance[];
  setTokenList: (arg: TokenWithBalance[]) => void;
  setSorted: (arg: boolean) => void;
};

const SortControl = ({
  tokenList,
  setTokenList,
  setSorted,
}: SortControlProps) => {
  const [sortKey, setSortKey] = useState<string | null>(null);

  const handleSort = (key: string, sortCallback: string, order: SortOrder) => {
    setSortKey(key);
    const sorted = sortAssets(tokenList, {
      key,
      sortCallback,
      order,
    });
    setSorted(true);
    setTokenList(sorted);
  };

  return (
    <>
      <SelectableListItem
        isSelected={sortKey === 'symbol'}
        onClick={() => handleSort('symbol', 'alphanumeric', 'asc')}
      >
        Alphabetically (A-Z)
      </SelectableListItem>
      <SelectableListItem
        isSelected={sortKey === 'tokenFiatAmount'}
        onClick={() => handleSort('tokenFiatAmount', 'stringNumeric', 'dsc')}
      >
        Declining balance ($ high-low)
      </SelectableListItem>
    </>
  );
};

// intentionally used generic naming convention for styled selectable list item
// inspired from ui/components/multichain/network-list-item
// should probably be broken out into component library
type SelectableListItemProps = {
  isSelected: boolean;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
  children: ReactNode;
};

export const SelectableListItem = ({
  isSelected,
  onClick,
  children,
}: SelectableListItemProps) => {
  return (
    <Box className="selectable-list-item-wrapper">
      <Box
        className={classnames('selectable-list-item', {
          'selectable-list-item--selected': isSelected,
        })}
        onClick={onClick}
      >
        {children}
      </Box>
      {isSelected && (
        <Box
          className="selectable-list-item__selected-indicator"
          borderRadius={BorderRadius.pill}
          backgroundColor={BackgroundColor.primaryDefault}
        />
      )}
    </Box>
  );
};

export default SortControl;
