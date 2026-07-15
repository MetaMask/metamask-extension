import React, { ReactNode, useCallback } from 'react';
import { useSelector } from 'react-redux';
import classnames from 'clsx';
import { Box, BoxBackgroundColor } from '@metamask/design-system-react';
import { Text } from '../../../../component-library';
import { SortOrder, SortingCallbacksT } from '../../util/sort';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { setTokenSortConfig } from '../../../../../store/actions';
import { useAnalytics } from '../../../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../../../../shared/constants/metametrics';
import { getTokenSortConfig } from '../../../../../selectors';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getCurrencySymbol } from '../../../../../helpers/utils/common.util';
import { useAppDispatch } from '../../../../../store/hooks';

// intentionally used generic naming convention for styled selectable list item
// inspired from ui/components/multichain/network-list-item
// should probably be broken out into component library
type SelectableListItemProps = {
  isSelected?: boolean;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
  testId?: string;
  className?: string;
  children: ReactNode;
};

export const SelectableListItem = ({
  isSelected,
  onClick,
  testId,
  className,
  children,
}: SelectableListItemProps) => {
  return (
    <Box className="selectable-list-item-wrapper" data-testid={testId}>
      <Text
        data-testid={`${testId}__button`}
        className={classnames(
          'selectable-list-item',
          {
            'selectable-list-item--selected': Boolean(isSelected),
          },
          className,
        )}
        onClick={onClick}
        variant={TextVariant.bodySmMedium}
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
          className="selectable-list-item__selected-indicator rounded-full"
          backgroundColor={BoxBackgroundColor.PrimaryDefault}
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
  const { trackEvent, createEventBuilder } = useAnalytics();
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const currentCurrency = useSelector(getCurrentCurrency);

  const dispatch = useAppDispatch();

  type SortKeys = 'title' | 'tokenFiatAmount';
  const handleSort = useCallback(
    (
      key: SortKeys,
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
      trackEvent(
        createEventBuilder(MetaMetricsEventName.TokenSortPreference)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            [MetaMetricsUserTrait.TokenSortPreference]: key,
          })
          .build(),
      );
      handleClose();
    },
    [createEventBuilder, dispatch, handleClose, trackEvent],
  );

  return (
    <>
      <SelectableListItem
        isSelected={
          // TODO: consolidate name and title fields in token to avoid this switch
          tokenSortConfig?.key === 'name' || tokenSortConfig?.key === 'title'
        }
        onClick={() =>
          // TODO: consolidate name and title fields in token to avoid this switch
          handleSort('title', 'alphaNumeric', 'asc')
        }
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
