import React, { ReactNode, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { Box } from '../../../../component-library';
import { TokenWithBalance } from '../asset-list';
import { SortOrder, SortingCallbacksT, sortAssets } from '../../util/sort';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
// import { setSortOrderCriteria } from '../../../../../ducks/app/app';
import { setTokenSortConfig } from '../../../../../store/actions';
// import { useTokenList } from '../../token-list/use-token-list';

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
  sorted: boolean;
};

const SortControl = ({
  tokenList,
  setTokenList,
  setSorted,
}: SortControlProps) => {
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenSortConfig = useSelector((state: any) => {
    return state.metamask.preferences.tokenSortConfig;
  });
  const dispatch = useDispatch();

  useEffect(() => {
    const [nativeToken] = tokenList.filter((token) => token.isNative);
    const nonNativeTokens = tokenList.filter((token) => !token.isNative);
    const dedupedTokenList = [nativeToken, ...nonNativeTokens];

    const sortedAssets = sortAssets(dedupedTokenList, tokenSortConfig);
    setSorted(true);
    setTokenList(sortedAssets);
  }, [tokenSortConfig]);

  const handleSort = (
    key: string,
    sortCallback: keyof SortingCallbacksT,
    order: SortOrder,
  ) => {
    dispatch(
      setTokenSortConfig({
        key,
        sortCallback,
        order,
      }),
    );
  };
  return (
    <>
      <SelectableListItem
        isSelected={tokenSortConfig.key === 'symbol'}
        onClick={() => handleSort('symbol', 'alphaNumeric', 'asc')}
      >
        Alphabetically (A-Z)
      </SelectableListItem>
      <SelectableListItem
        isSelected={tokenSortConfig.key === 'tokenFiatAmount'}
        onClick={() => handleSort('tokenFiatAmount', 'stringNumeric', 'dsc')}
      >
        Declining balance ($ high-low)
      </SelectableListItem>
    </>
  );
};

export default SortControl;
