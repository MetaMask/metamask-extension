import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Box,
  BoxFlexDirection,
  ModalFooter,
  Text,
  TextColor,
  TextVariant,
  FontWeight,
  twMerge,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getEnvironmentType } from '../../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../../shared/constants/app';
import { formatGroupingLabel } from './order-book.utils';
import type {
  OrderBookListCurrency,
  OrderBookListMetric,
  PerpsOrderBookConfigModalProps,
} from './order-book.types';

const PILL_BASE_CLASS =
  'flex items-center justify-center rounded-full py-3 px-4 cursor-pointer transition-colors duration-150 border';
const PILL_SELECTED_CLASS = 'bg-transparent border-muted';
const PILL_UNSELECTED_CLASS =
  'bg-muted border-transparent hover:bg-muted-hover';

type PillProps = {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  tabIndex?: number;
  className?: string;
  testId?: string;
};

const Pill = ({
  label,
  isSelected,
  onSelect,
  onKeyDown,
  tabIndex = 0,
  className,
  testId,
}: PillProps) => (
  <Box
    role="radio"
    tabIndex={tabIndex}
    aria-checked={isSelected}
    onClick={onSelect}
    onKeyDown={onKeyDown}
    data-testid={testId}
    className={twMerge(
      PILL_BASE_CLASS,
      isSelected ? PILL_SELECTED_CLASS : PILL_UNSELECTED_CLASS,
      className,
    )}
  >
    <Text
      variant={TextVariant.BodyMd}
      fontWeight={isSelected ? FontWeight.Medium : FontWeight.Regular}
      color={isSelected ? TextColor.TextDefault : TextColor.TextAlternative}
    >
      {label}
    </Text>
  </Box>
);

type RadioPillOption<Value> = {
  value: Value;
  label: string;
  testId?: string;
};

type RadioPillGroupProps<Value> = {
  ariaLabel: string;
  options: RadioPillOption<Value>[];
  value: Value | null;
  onChange: (value: Value) => void;
  className?: string;
  pillClassName?: string;
};

/**
 * A WAI-ARIA radiogroup of pills implementing the roving-tabindex pattern.
 *
 * Exactly one pill is in the tab order at a time — the checked one, or the
 * first pill when nothing is checked — and Arrow/Home/End keys move both focus
 * and selection between options (with wraparound), matching the keyboard
 * contract that `role="radio"` advertises to screen readers. Enter/Space
 * select the focused pill. Focus is moved imperatively by querying the group's
 * rendered radios, so the pills stay presentational.
 *
 * @param props - Component props.
 * @param props.ariaLabel - Accessible name for the radiogroup.
 * @param props.options - Selectable options rendered as pills.
 * @param props.value - Currently selected value, or null when none.
 * @param props.onChange - Called with the newly selected value.
 * @param props.className - Optional class for the group container.
 * @param props.pillClassName - Optional class applied to every pill.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function RadioPillGroup<Value extends string | number>({
  ariaLabel,
  options,
  value,
  onChange,
  className,
  pillClassName,
}: RadioPillGroupProps<Value>) {
  const groupRef = useRef<HTMLDivElement>(null);

  const selectedIndex = options.findIndex((option) => option.value === value);
  // The group always exposes a single tab stop: the selected option, or the
  // first option when nothing is selected yet.
  const tabStopIndex = selectedIndex === -1 ? 0 : selectedIndex;

  const moveTo = useCallback(
    (index: number) => {
      if (options.length === 0) {
        return;
      }
      const nextIndex = (index + options.length) % options.length;
      onChange(options[nextIndex].value);
      const radios =
        groupRef.current?.querySelectorAll<HTMLElement>('[role="radio"]');
      radios?.[nextIndex]?.focus();
    },
    [onChange, options],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          moveTo(index + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          moveTo(index - 1);
          break;
        case 'Home':
          event.preventDefault();
          moveTo(0);
          break;
        case 'End':
          event.preventDefault();
          moveTo(options.length - 1);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          onChange(options[index].value);
          break;
        default:
          break;
      }
    },
    [moveTo, onChange, options],
  );

  return (
    <Box
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      flexDirection={BoxFlexDirection.Row}
      gap={3}
      className={className}
    >
      {options.map((option, index) => (
        <Pill
          key={String(option.value)}
          label={option.label}
          isSelected={option.value === value}
          tabIndex={index === tabStopIndex ? 0 : -1}
          onSelect={() => onChange(option.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          className={pillClassName}
          testId={option.testId}
        />
      ))}
    </Box>
  );
}

/**
 * PerpsOrderBookConfigModal - "Listed by & Group by" bottom sheet used to pick
 * the order book's denomination (base/USD), the value column metric
 * (size/total) and the price grouping increment.
 *
 * @param props - Component props.
 * @param props.isOpen
 * @param props.baseSymbol
 * @param props.currency
 * @param props.metric
 * @param props.grouping
 * @param props.groupingOptions
 * @param props.onApply
 * @param props.onClose
 * @param props.'data-testid'
 * @param props.id
 */
export const PerpsOrderBookConfigModal = ({
  isOpen,
  id,
  baseSymbol,
  currency,
  metric,
  grouping,
  groupingOptions,
  onApply,
  onClose,
  'data-testid': dataTestId = 'perps-order-book-config-modal',
}: PerpsOrderBookConfigModalProps) => {
  const t = useI18nContext();
  const [draftCurrency, setDraftCurrency] =
    useState<OrderBookListCurrency>(currency);
  const [draftMetric, setDraftMetric] = useState<OrderBookListMetric>(metric);
  const [draftGrouping, setDraftGrouping] = useState<number | null>(grouping);

  useEffect(() => {
    if (isOpen) {
      setDraftCurrency(currency);
      setDraftMetric(metric);
      setDraftGrouping(grouping);
    }
  }, [isOpen, currency, metric, grouping]);

  const environmentType = getEnvironmentType();
  const isCompactSheet =
    environmentType === ENVIRONMENT_TYPE_POPUP ||
    environmentType === ENVIRONMENT_TYPE_SIDEPANEL;

  const modalLayoutProps = useMemo(
    () =>
      isCompactSheet
        ? {
            justifyContent: JustifyContent.flexEnd,
            alignItems: AlignItems.stretch,
            dialogStyle: {
              marginTop: 'auto',
              width: '100%',
              maxWidth: '100%',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
            },
          }
        : {
            justifyContent: JustifyContent.center,
            alignItems: AlignItems.center,
            dialogStyle: {
              width: '100%',
              maxWidth: '360px',
              borderRadius: '20px',
            },
          },
    [isCompactSheet],
  );

  if (!isOpen) {
    return null;
  }

  const handleApply = () => {
    onApply({
      currency: draftCurrency,
      metric: draftMetric,
      grouping: draftGrouping ?? groupingOptions[0] ?? 1,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} data-testid={dataTestId}>
      <ModalOverlay />
      <ModalContent
        id={id}
        size={ModalContentSize.Sm}
        display={Display.Flex}
        justifyContent={modalLayoutProps.justifyContent}
        alignItems={modalLayoutProps.alignItems}
        padding={0}
        modalDialogProps={{
          padding: 0,
          style: modalLayoutProps.dialogStyle,
        }}
      >
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{ 'data-testid': `${dataTestId}-close` }}
        >
          {t('perpsOrderBookConfigTitle')}
        </ModalHeader>

        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={4}
          paddingLeft={4}
          paddingRight={4}
          paddingBottom={4}
        >
          {/* Listed by */}
          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('perpsOrderBookListedBy')}
            </Text>
            <RadioPillGroup<OrderBookListCurrency>
              ariaLabel={t('perpsOrderBookListedBy')}
              value={draftCurrency}
              onChange={setDraftCurrency}
              pillClassName="flex-1"
              options={[
                {
                  value: 'base',
                  label: baseSymbol,
                  testId: `${dataTestId}-currency-base`,
                },
                {
                  value: 'usd',
                  label: 'USD',
                  testId: `${dataTestId}-currency-usd`,
                },
              ]}
            />
            <RadioPillGroup<OrderBookListMetric>
              ariaLabel={t('perpsOrderBookValueType')}
              value={draftMetric}
              onChange={setDraftMetric}
              pillClassName="flex-1"
              options={[
                {
                  value: 'size',
                  label: t('perpsOrderBookSize'),
                  testId: `${dataTestId}-metric-size`,
                },
                {
                  value: 'total',
                  label: t('perpsOrderBookTotal'),
                  testId: `${dataTestId}-metric-total`,
                },
              ]}
            />
          </Box>

          {/* Group by */}
          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('perpsOrderBookGroupBy')}
            </Text>
            <RadioPillGroup<number>
              ariaLabel={t('perpsOrderBookGroupBy')}
              value={draftGrouping}
              onChange={setDraftGrouping}
              className="flex-wrap"
              pillClassName="min-w-16"
              options={groupingOptions.map((option) => ({
                value: option,
                label: formatGroupingLabel(option),
                testId: `${dataTestId}-grouping-${option}`,
              }))}
            />
          </Box>
        </Box>

        <ModalFooter
          className="pb-4"
          primaryButtonProps={{
            children: t('perpsOrderBookApply'),
            onClick: handleApply,
            type: 'button',
            'data-testid': `${dataTestId}-apply`,
          }}
        />
      </ModalContent>
    </Modal>
  );
};

export default PerpsOrderBookConfigModal;
