import React, { useState, useCallback } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
  ButtonBase,
  ButtonBaseSize,
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalContentSize,
  ModalBody,
  ModalFooter,
} from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import type { SortField, SortDirection } from '../../../utils/sortMarkets';

export type SortOption = {
  id: SortField;
  labelKey: string;
};

export const SORT_FIELD_OPTIONS: SortOption[] = [
  { id: 'volume', labelKey: 'perpsSortByVolume' },
  { id: 'priceChange', labelKey: 'perpsSortByPriceChange' },
  { id: 'openInterest', labelKey: 'perpsSortByOpenInterest' },
  { id: 'fundingRate', labelKey: 'perpsSortByFundingRate' },
];

export type SortDropdownProps = {
  /** Currently selected sort field */
  selectedField: SortField;
  /** Currently selected sort direction */
  direction: SortDirection;
  /** Callback when sort field or direction changes */
  onChange: (field: SortField, direction: SortDirection) => void;
};

/**
 * SortDropdown component — opens a modal with separate field and direction selection.
 * Matches the mobile PerpsMarketSortFieldBottomSheet design pattern.
 * @param options0
 * @param options0.selectedField
 * @param options0.direction
 * @param options0.onChange
 */
export const SortDropdown: React.FC<SortDropdownProps> = ({
  selectedField,
  direction,
  onChange,
}) => {
  const t = useI18nContext();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingField, setPendingField] = useState<SortField>(selectedField);
  const [pendingDirection, setPendingDirection] =
    useState<SortDirection>(direction);

  const handleOpen = useCallback(() => {
    setPendingField(selectedField);
    setPendingDirection(direction);
    setIsOpen(true);
  }, [selectedField, direction]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleApply = useCallback(() => {
    onChange(pendingField, pendingDirection);
    setIsOpen(false);
  }, [pendingField, pendingDirection, onChange]);

  const currentFieldOption = SORT_FIELD_OPTIONS.find(
    (opt) => opt.id === selectedField,
  );

  return (
    <>
      {/* Trigger button */}
      <ButtonBase
        size={ButtonBaseSize.Sm}
        className="flex items-center justify-start gap-1 rounded-lg bg-background-muted px-3 py-2 hover:bg-hover active:opacity-70"
        onClick={handleOpen}
        data-testid="sort-dropdown-button"
      >
        <Icon
          name={IconName.SwapVertical}
          size={IconSize.Xs}
          color={IconColor.IconAlternative}
        />
        <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
          {currentFieldOption ? t(currentFieldOption.labelKey) : ''}
        </Text>
      </ButtonBase>

      {/* Sort modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        data-testid="sort-field-modal"
      >
        <ModalOverlay />
        <ModalContent size={ModalContentSize.Sm}>
          <ModalHeader onClose={handleClose}>
            <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Bold}>
              {t('perpsSortByTitle')}
            </Text>
          </ModalHeader>

          <ModalBody>
            {/* Sort field options */}
            <Box flexDirection={BoxFlexDirection.Column}>
              {SORT_FIELD_OPTIONS.map((option) => {
                const isSelected = pendingField === option.id;
                return (
                  <ButtonBase
                    key={option.id}
                    onClick={() => setPendingField(option.id)}
                    className="w-full justify-between text-left rounded-none px-0 py-3 bg-transparent min-w-0 h-auto hover:bg-hover active:bg-pressed border-b border-border-muted last:border-b-0"
                    data-testid={`sort-field-option-${option.id}`}
                  >
                    <Text
                      variant={TextVariant.BodyMd}
                      color={
                        isSelected
                          ? TextColor.TextDefault
                          : TextColor.TextAlternative
                      }
                    >
                      {t(option.labelKey)}
                    </Text>
                    {isSelected && (
                      <Icon
                        name={IconName.Check}
                        size={IconSize.Sm}
                        color={IconColor.IconDefault}
                      />
                    )}
                  </ButtonBase>
                );
              })}
            </Box>

            {/* Sort direction section */}
            <Box className="mt-4" flexDirection={BoxFlexDirection.Column}>
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                className="mb-2 uppercase tracking-wide"
              >
                {t('perpsSortBySection')}
              </Text>

              {(
                [
                  { value: 'desc' as const, labelKey: 'perpsSortByHighToLow' },
                  { value: 'asc' as const, labelKey: 'perpsSortByLowToHigh' },
                ] as const
              ).map(({ value, labelKey }) => {
                const isSelected = pendingDirection === value;
                return (
                  <ButtonBase
                    key={value}
                    onClick={() => setPendingDirection(value)}
                    className="w-full justify-between text-left rounded-none px-0 py-3 bg-transparent min-w-0 h-auto hover:bg-hover active:bg-pressed border-b border-border-muted last:border-b-0"
                    data-testid={`sort-direction-${value}`}
                  >
                    <Text
                      variant={TextVariant.BodyMd}
                      color={
                        isSelected
                          ? TextColor.TextDefault
                          : TextColor.TextAlternative
                      }
                    >
                      {t(labelKey)}
                    </Text>
                    {isSelected && (
                      <Icon
                        name={IconName.Check}
                        size={IconSize.Sm}
                        color={IconColor.IconDefault}
                      />
                    )}
                  </ButtonBase>
                );
              })}
            </Box>
          </ModalBody>

          <ModalFooter>
            <Box
              flexDirection={BoxFlexDirection.Row}
              gap={3}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Between}
              className="w-full"
            >
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Md}
                onClick={handleClose}
                className="flex-1"
                data-testid="sort-modal-cancel"
              >
                {t('cancel')}
              </Button>
              <Button
                variant={ButtonVariant.Primary}
                size={ButtonSize.Md}
                onClick={handleApply}
                className="flex-1"
                data-testid="sort-modal-apply"
              >
                {t('apply')}
              </Button>
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SortDropdown;
