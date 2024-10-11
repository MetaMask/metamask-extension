import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTokenNetworkFilter } from '../../../../../store/actions';
import { getCurrentChainId, getPreferences } from '../../../../../selectors';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { SelectableListItem } from '../sort-control/sort-control';

type SortControlProps = {
  handleClose: () => void;
};

const NetworkFilter = ({ handleClose }: SortControlProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const chainId = useSelector(getCurrentChainId);
  const { tokenNetworkFilter } = useSelector(getPreferences);

  const handleFilter = (chainFilters: Record<string, string>) => {
    console.log('filter', chainFilters);
    dispatch(setTokenNetworkFilter(chainFilters));

    // TODO Add metrics
    handleClose();
  };

  return (
    <>
      <SelectableListItem isSelected={false} onClick={() => handleFilter({})}>
        All Networks
      </SelectableListItem>
      <SelectableListItem
        isSelected={false}
        onClick={() => handleFilter({ chainId })}
      >
        Current Network
      </SelectableListItem>
    </>
  );
};

export default NetworkFilter;
