import React, { ReactNode, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  ButtonBase,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import { SortOrder, SortingCallbacksT } from '../../util/sort';
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
import { useDispatch } from '../../../../../store/hooks';

type SelectableListItemProps = {
  isSelected?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
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
}: SelectableListItemProps) => (
  <Box data-testid={testId} className="w-full">
    <ButtonBase
      data-testid={testId ? `${testId}__button` : undefined}
      onClick={onClick}
      aria-pressed={isSelected}
      className={twMerge(
        'h-auto min-h-12 w-full justify-start rounded-none p-4 text-left active:scale-100',
        isSelected
          ? 'bg-muted hover:bg-muted-hover active:bg-muted-pressed'
          : 'bg-transparent hover:bg-hover active:bg-pressed',
        'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-default',
        className,
      )}
    >
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.TextDefault}
        asChild
      >
        <span className="flex min-w-0 grow items-center text-left">
          {children}
        </span>
      </Text>
    </ButtonBase>
  </Box>
);

type SortControlProps = {
  handleClose: () => void;
};

const SortControl = ({ handleClose }: SortControlProps) => {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const currentCurrency = useSelector(getCurrentCurrency);

  const dispatch = useDispatch();

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
