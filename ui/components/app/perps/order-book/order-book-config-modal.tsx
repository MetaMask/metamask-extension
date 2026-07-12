import React, { useEffect, useMemo, useState } from 'react';
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
  className?: string;
  testId?: string;
};

const Pill = ({
  label,
  isSelected,
  onSelect,
  className,
  testId,
}: PillProps) => (
  <Box
    role="radio"
    tabIndex={0}
    aria-checked={isSelected}
    onClick={onSelect}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect();
      }
    }}
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
            <Box
              role="radiogroup"
              aria-label={t('perpsOrderBookListedBy')}
              flexDirection={BoxFlexDirection.Row}
              gap={3}
            >
              <Pill
                label={baseSymbol}
                isSelected={draftCurrency === 'base'}
                onSelect={() => setDraftCurrency('base')}
                className="flex-1"
                testId={`${dataTestId}-currency-base`}
              />
              <Pill
                label="USD"
                isSelected={draftCurrency === 'usd'}
                onSelect={() => setDraftCurrency('usd')}
                className="flex-1"
                testId={`${dataTestId}-currency-usd`}
              />
            </Box>
            <Box
              role="radiogroup"
              aria-label={t('perpsOrderBookValueType')}
              flexDirection={BoxFlexDirection.Row}
              gap={3}
            >
              <Pill
                label={t('perpsOrderBookSize')}
                isSelected={draftMetric === 'size'}
                onSelect={() => setDraftMetric('size')}
                className="flex-1"
                testId={`${dataTestId}-metric-size`}
              />
              <Pill
                label={t('perpsOrderBookTotal')}
                isSelected={draftMetric === 'total'}
                onSelect={() => setDraftMetric('total')}
                className="flex-1"
                testId={`${dataTestId}-metric-total`}
              />
            </Box>
          </Box>

          {/* Group by */}
          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('perpsOrderBookGroupBy')}
            </Text>
            <Box
              role="radiogroup"
              aria-label={t('perpsOrderBookGroupBy')}
              flexDirection={BoxFlexDirection.Row}
              gap={3}
              className="flex-wrap"
            >
              {groupingOptions.map((option) => (
                <Pill
                  key={option}
                  label={formatGroupingLabel(option)}
                  isSelected={draftGrouping === option}
                  onSelect={() => setDraftGrouping(option)}
                  className="min-w-16"
                  testId={`${dataTestId}-grouping-${option}`}
                />
              ))}
            </Box>
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
