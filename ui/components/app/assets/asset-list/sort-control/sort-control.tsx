import React, { ReactNode, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { Box } from '../../../../component-library';
import { SortOrder, SortingCallbacksT } from '../../util/sort';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { setTokenSortConfig } from '../../../../../store/actions';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../../../../shared/constants/metametrics';
import { getPreferences } from '../../../../../selectors';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

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

const SortControl = () => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const { tokenSortConfig } = useSelector(getPreferences);

  const dispatch = useDispatch();

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
    trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.TokenSortPreference,
      properties: {
        [MetaMetricsUserTrait.TokenSortPreference]: key,
      },
    });
  };
  return (
    <>
      <SelectableListItem
        isSelected={tokenSortConfig?.key === 'symbol'}
        onClick={() => handleSort('symbol', 'alphaNumeric', 'asc')}
      >
        {t('sortByAlphabetically')}
      </SelectableListItem>
      <SelectableListItem
        isSelected={tokenSortConfig?.key === 'tokenFiatAmount'}
        onClick={() => handleSort('tokenFiatAmount', 'stringNumeric', 'dsc')}
      >
        {t('sortByDecliningBalance')}
      </SelectableListItem>
    </>
  );
};

export default SortControl;
