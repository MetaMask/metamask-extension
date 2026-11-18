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
export const SortDropdown = ({
  selectedField,
  direction,
  onChange,
}: SortDropdownProps) => {
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

  const handleSelectField = useCallback(
    (field: SortField) => {
      if (field === pendingField) {
        setPendingDirection((current) => (current === 'desc' ? 'asc' : 'desc'));
        return;
      }
      setPendingField(field);
    },
    [pendingField],
  );

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
            {t('perpsSortByTitle')}
          </ModalHeader>

          <ModalBody className="!p-0">
            {/* One list, no section headers: the design (Figma 12602:46701)
                folds the rank into the sort row rather than giving it its own
                section, so the selected field carries its direction inline and
                pressing it again reverses it. */}
            <Box flexDirection={BoxFlexDirection.Column} className="w-full">
              {SORT_FIELD_OPTIONS.map((option) => {
                const isSelected = pendingField === option.id;
                return (
                  <ButtonBase
                    key={option.id}
                    onClick={() => handleSelectField(option.id)}
                    className={`w-full justify-between text-left rounded-none p-4 min-w-0 h-auto active:bg-pressed ${
                      isSelected
                        ? 'bg-background-muted'
                        : 'bg-transparent hover:bg-hover'
                    }`}
                    aria-pressed={isSelected}
                    data-testid={`sort-field-option-${option.id}`}
                  >
                    <Text
                      variant={TextVariant.BodyMd}
                      color={TextColor.TextDefault}
                      fontWeight={FontWeight.Medium}
                    >
                      {t(option.labelKey)}
                    </Text>
                    {isSelected && (
                      <Box
                        flexDirection={BoxFlexDirection.Row}
                        alignItems={BoxAlignItems.Center}
                        gap={2}
                        data-testid="sort-field-direction"
                      >
                        <Text
                          variant={TextVariant.BodyMd}
                          color={TextColor.TextAlternative}
                          fontWeight={FontWeight.Medium}
                        >
                          {t(
                            pendingDirection === 'desc'
                              ? 'perpsSortByHighToLow'
                              : 'perpsSortByLowToHigh',
                          )}
                        </Text>
                        <Icon
                          // `Arrow2Down`/`Arrow2Up` are the design's assets but
                          // resolve to undefined on some design-system
                          // installs, and `Icon` then renders nothing.
                          name={
                            pendingDirection === 'desc'
                              ? IconName.ArrowDown
                              : IconName.ArrowUp
                          }
                          size={IconSize.Md}
                          color={IconColor.IconAlternative}
                        />
                      </Box>
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
