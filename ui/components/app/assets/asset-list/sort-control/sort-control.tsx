import React, { useState, ReactNode } from 'react';
import classnames from 'classnames';
import { Box } from '../../../../component-library';
import { TokenWithBalance } from '../asset-list';
import { SortOrder, SortingCallbacksT, sortAssets } from '../../util/sort';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { useDispatch } from 'react-redux';
import { setSortOrderCriteria } from '../../../../../ducks/app/app';

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
  const dispatch = useDispatch();
  const [sortKey, setSortKey] = useState<string | null>(null);

  const handleSort = (
    key: string,
    sortCallback: keyof SortingCallbacksT,
    order: SortOrder,
  ) => {
    const [nativeToken] = tokenList.filter((token) => token.isNative);
    const nonNativeTokens = tokenList.filter((token) => !token.isNative);
    const dedupedTokenList = [nativeToken, ...nonNativeTokens];

    setSortKey(key);
    const sorted = sortAssets(dedupedTokenList, {
      key,
      sortCallback,
      order,
    });

    setSorted(true);
    dispatch(
      setSortOrderCriteria({
        key,
        sortCallback,
        order,
      }),
    );
    setTokenList(sorted);
  };

  return (
    <>
      <SelectableListItem
        isSelected={sortKey === 'symbol'}
        onClick={() => handleSort('symbol', 'alphaNumeric', 'asc')}
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

export default SortControl;
