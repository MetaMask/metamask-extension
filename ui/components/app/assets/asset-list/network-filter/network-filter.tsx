import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTokenNetworkFilter } from '../../../../../store/actions';
import { getCurrentChainId, getPreferences } from '../../../../../selectors';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { SelectableListItem } from '../sort-control/sort-control';
// import { Text } from '../../../../component-library/text/text';
// import { Box } from '../../../../component-library/box/box';

type SortControlProps = {
  handleClose: () => void;
};

const NetworkFilter = ({ handleClose }: SortControlProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const chainId = useSelector(getCurrentChainId);
  const { tokenNetworkFilter } = useSelector(getPreferences);

  const handleFilter = (chainFilters: Record<string, boolean>) => {
    dispatch(setTokenNetworkFilter(chainFilters));

    // TODO Add metrics
    handleClose();
  };

  return (
    <>
      <SelectableListItem
        isSelected={!Object.keys(tokenNetworkFilter).length}
        onClick={() => handleFilter({})}
      >
        All Networks 12,000
      </SelectableListItem>
      <SelectableListItem
        isSelected={tokenNetworkFilter[chainId]}
        onClick={() => handleFilter({ [chainId]: true })}
      >
        Current Network 2,000
      </SelectableListItem>
    </>
  );
};

export default NetworkFilter;
