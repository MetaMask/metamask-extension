import React, { ReactNode, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { Box, Text } from '../../../../component-library';
import { SortOrder, SortingCallbacksT } from '../../util/sort';
import {
  BackgroundColor,
  BorderRadius,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { setTokenSortConfig } from '../../../../../store/actions';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../../../../shared/constants/metametrics';
import { getCurrentCurrency, getPreferences } from '../../../../../selectors';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getCurrencySymbol } from '../../../../../helpers/utils/common.util';
import { SelectableListItem } from '../sort-control/sort-control';

type SortControlProps = {
  handleClose: () => void;
};

const NetworkFilter = ({ handleClose }: SortControlProps) => {
  const t = useI18nContext();
  // const trackEvent = useContext(MetaMetricsContext);
  // const { tokenSortConfig } = useSelector(getPreferences);
  // const currentCurrency = useSelector(getCurrentCurrency);

  // const dispatch = useDispatch();

  const handleFilter = () => {
    console.log('filter');
    // dispatch(setNetworkFilter()); TODO Add dispatcher

    // TODO Add metrics
    // trackEvent({
    //   category: MetaMetricsEventCategory.Settings,
    //   event: MetaMetricsEventName.TokenSortPreference,
    //   properties: {
    //     [MetaMetricsUserTrait.TokenSortPreference]: key,
    //   },
    // });
    handleClose();
  };
  return (
    <>
      <SelectableListItem isSelected={false} onClick={handleFilter}>
        All Networks
      </SelectableListItem>
      <SelectableListItem isSelected={false} onClick={handleFilter}>
        Current Network
      </SelectableListItem>
    </>
  );
};

export default NetworkFilter;
