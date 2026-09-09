import React, { ReactNode, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  ButtonBase,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
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
  /**
   * Marks the item as one of a set of mutually exclusive options. Omit it for
   * items that trigger an action rather than select a value.
   */
  isSelected?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  testId?: string;
  className?: string;
  children: ReactNode;
};

/**
 * A single row of a popover menu, built on the design system `ButtonBase` so
 * that hover, active and focus states match the other menus in the extension.
 * Selected options are marked with a muted background and a trailing check,
 * the same way network, currency and language options are marked elsewhere.
 *
 * @param props - The props of the component.
 * @param props.isSelected - Whether the item is the selected option.
 * @param props.onClick - Handler called when the item is clicked.
 * @param props.testId - Test id applied to the item, the button itself gets
 * `${testId}__button`.
 * @param props.className - Additional classes for the button.
 * @param props.children - The content of the item.
 */
export const SelectableListItem = ({
  isSelected,
  onClick,
  testId,
  className,
  children,
}: SelectableListItemProps) => {
  const optionProps: Pick<
    React.ComponentProps<'button'>,
    'role' | 'aria-checked'
  > = isSelected === undefined
    ? {}
    : { role: 'menuitemradio', 'aria-checked': isSelected };

  return (
    <Box data-testid={testId} className="w-full">
      <ButtonBase
        data-testid={testId ? `${testId}__button` : undefined}
        onClick={onClick}
        {...optionProps}
        className={twMerge(
          'h-auto min-h-12 w-full justify-start gap-2 rounded-none p-4 text-left',
          // The row is full-bleed inside the popover, so the press animation
          // ButtonBase applies would pull it away from the popover edges.
          'active:scale-100',
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
        {isSelected && (
          <Icon
            name={IconName.Check}
            size={IconSize.Md}
            color={IconColor.IconDefault}
            className="shrink-0"
          />
        )}
      </ButtonBase>
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
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="flex w-full"
      role="menu"
      aria-label={t('sortBy')}
    >
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
    </Box>
  );
};

export default SortControl;
