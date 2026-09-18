import React, { useState } from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  ModalFooter,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  TextField,
  TextFieldSize,
  TextFieldType,
} from '../../../../../components/component-library';
import {
  BorderColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
// eslint-disable-next-line import-x/no-restricted-paths
import { sanitizeAmountInput } from '../../../../bridge/utils/quote';

type SlippageModalProps = {
  open: boolean;
  onClose: () => void;
  value?: number;
  onChange: (newSlippagePercent: number) => void;
  slippageOptions: number[];
  warningSlippageTheshold: number;
};

export const SlippageModal = ({
  open,
  onClose,
  value,
  onChange,
  slippageOptions,
  warningSlippageTheshold,
}: SlippageModalProps) => {
  const t = useI18nContext();

  const [draftValue, setDraftValue] = useState(value);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleClose = () => {
    setDraftValue(value);
    setShowCustomInput(false);
    setInputValue('');
    onClose();
  };

  const pendingCustomValue =
    showCustomInput && inputValue.length > 0 ? Number(inputValue) : undefined;
  const effectiveDraftValue =
    pendingCustomValue !== undefined && !isNaN(pendingCustomValue)
      ? pendingCustomValue
      : draftValue;

  const isCustomSlippage =
    draftValue !== undefined && !slippageOptions.includes(draftValue);

  const showLowSlippageWarning =
    effectiveDraftValue !== undefined &&
    !isNaN(effectiveDraftValue) &&
    effectiveDraftValue < warningSlippageTheshold;

  const isSubmitDisabled =
    effectiveDraftValue === undefined ||
    isNaN(effectiveDraftValue) ||
    effectiveDraftValue === value ||
    effectiveDraftValue <= 0 ||
    effectiveDraftValue > 100;

  const handleSubmit = () => {
    if (isSubmitDisabled) {
      return handleClose();
    }

    onChange(effectiveDraftValue);
  };

  const handlePresetClick = (option: number) => {
    setDraftValue(option);
    setShowCustomInput(false);
    setInputValue('');
  };

  const handleCustomButtonClick = () => {
    setInputValue(draftValue?.toString() ?? '');
    setShowCustomInput(true);
  };

  const handleCustomInputChange = (
    event:
      | React.ClipboardEvent<HTMLInputElement>
      | React.KeyboardEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLInputElement>,
    nextValue: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setInputValue(sanitizeAmountInput(nextValue, false));
  };

  const handleCustomInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (!sanitizeAmountInput(e.key) && e.key.length === 1) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleCustomInputBlur = () => {
    setShowCustomInput(false);
    const nextSlippage = Number(inputValue);
    if (inputValue.length > 0 && !isNaN(nextSlippage)) {
      setDraftValue(nextSlippage);
    }
    setInputValue('');
  };

  return (
    <Modal
      isOpen={open}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
      onClose={handleClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={handleClose}>
          <Text textAlign={TextAlign.Center} variant={TextVariant.HeadingSm}>
            {t('slippage')}
          </Text>
        </ModalHeader>
        <ModalBody>
          <Text
            className="pb-4"
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            textAlign={TextAlign.Center}
          >
            {t('batchSellSlippageDescription')}
          </Text>
          <Box flexDirection={BoxFlexDirection.Row} gap={2}>
            {slippageOptions.map((option) => {
              const isSelected = draftValue === option;
              return (
                <Button
                  key={option}
                  size={ButtonSize.Md}
                  variant={
                    isSelected ? ButtonVariant.Primary : ButtonVariant.Secondary
                  }
                  onClick={() => handlePresetClick(option)}
                >
                  {`${option}%`}
                </Button>
              );
            })}
            {!showCustomInput && (
              <Button
                size={ButtonSize.Md}
                variant={
                  isCustomSlippage
                    ? ButtonVariant.Primary
                    : ButtonVariant.Secondary
                }
                onClick={handleCustomButtonClick}
              >
                {isCustomSlippage ? `${draftValue}%` : t('customSlippage')}
              </Button>
            )}
            {showCustomInput && (
              <TextField
                className="flex-1"
                size={TextFieldSize.Md}
                borderColor={BorderColor.borderMuted}
                borderRadius={BorderRadius.XL}
                type={TextFieldType.Text}
                value={inputValue}
                onPaste={(e: React.ClipboardEvent<HTMLInputElement>) =>
                  handleCustomInputChange(e, e.clipboardData.getData('text'))
                }
                onKeyDown={handleCustomInputKeyDown}
                onChange={(e) => handleCustomInputChange(e, e.target.value)}
                autoFocus
                onBlur={handleCustomInputBlur}
                onFocus={() => setShowCustomInput(true)}
                endAccessory={<Text variant={TextVariant.BodyMd}>%</Text>}
              />
            )}
          </Box>
          {showLowSlippageWarning && (
            <Box marginTop={4}>
              <BannerAlert
                severity={BannerAlertSeverity.Warning}
                title={t('swapSlippageLowTitle')}
              >
                <Text variant={TextVariant.BodyMd}>
                  {t('swapSlippageLowDescription', [effectiveDraftValue])}
                </Text>
              </BannerAlert>
            </Box>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            size={ButtonSize.Lg}
            variant={ButtonVariant.Primary}
            isFullWidth
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            <Text
              variant={TextVariant.ButtonLabelMd}
              fontWeight={FontWeight.Medium}
              textAlign={TextAlign.Center}
              color={TextColor.PrimaryInverse}
            >
              {t('submit')}
            </Text>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
