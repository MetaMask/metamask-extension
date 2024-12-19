import React, { ReactNode, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { Box, Text } from '../../../../component-library';
import { SortOrder, SortingCallbacksT } from '../../util/sort';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { setTokenSortConfig } from '../../../../../store/actions';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../../../../shared/constants/metametrics';
import { getPreferences } from '../../../../../selectors';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getCurrencySymbol } from '../../../../../helpers/utils/common.util';

// intentionally used generic naming convention for styled selectable list item
// inspired from ui/components/multichain/network-list-item
// should probably be broken out into component library
type SelectableListItemProps = {
  isSelected?: boolean;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
  testId?: string;
  children: ReactNode;
};

export const SelectableListItem = ({
  isSelected,
  onClick,
  testId,
  children,
}: SelectableListItemProps) => {
  return (
    <Box className="selectable-list-item-wrapper" data-testid={testId}>
      <Text
        data-testid={`${testId}__button`}
        className={classnames('selectable-list-item', {
          'selectable-list-item--selected': Boolean(isSelected),
        })}
        onClick={onClick}
        variant={TextVariant.bodyMd}
        as="button"
        width={BlockSize.Full}
        backgroundColor={BackgroundColor.backgroundDefault}
        display={Display.Flex}
        alignItems={AlignItems.center}
      >
        {children}
      </Text>
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
  handleClose: () => void;
};

const SortControl = ({ handleClose }: SortControlProps) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const { tokenSortConfig } = useSelector(getPreferences);
  const currentCurrency = useSelector(getCurrentCurrency);

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
    handleClose();
  };
  return (
    <>
      <SelectableListItem
        isSelected={tokenSortConfig?.key === 'symbol'}
        onClick={() => handleSort('symbol', 'alphaNumeric', 'asc')}
        testId="sortByAlphabetically"
      >
        {t('sortByAlphabetically')}
      </SelectableListItem>
      <SelectableListItem
        isSelected={tokenSortConfig?.key === 'tokenFiatAmount'}
        onClick={() => handleSort('tokenFiatAmount', 'stringNumeric', 'dsc')}
        testId="sortByDecliningBalance"
      >
        {t('sortByDecliningBalance', [getCurrencySymbol(currentCurrency)])}
      </SelectableListItem>
    </>
  );
};

export default SortControl;
