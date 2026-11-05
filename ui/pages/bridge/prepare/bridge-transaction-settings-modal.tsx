import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  TextField,
  TextFieldSize,
  TextFieldType,
  TextVariant,
} from '@metamask/design-system-react';
import { PopoverPosition } from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getIsSolanaSwap,
  getIsRWASwap,
  getSlippage,
} from '../../../ducks/bridge/selectors';
import { setSlippageUserOverride } from '../../../ducks/bridge/actions';
import { SlippageValue } from '../utils/slippage-service';
import { Tooltip } from '../layout';
import { sanitizeAmountInput } from '../utils/quote';
import { useDispatch } from '../../../store/hooks';

const HARDCODED_SLIPPAGE_OPTIONS = [
  SlippageValue.EvmStablecoin,
  SlippageValue.BridgeDefault,
];

// `!` beats the MMDS secondary `hover:bg-muted-hover` so the option keeps the
// previous default-hover fill.
const getSlippageOptionButtonProps = (isSelected: boolean) =>
  isSelected
    ? { variant: ButtonVariant.Primary }
    : {
        variant: ButtonVariant.Secondary,
        className: 'hover:!bg-default-hover',
      };

export const BridgeTransactionSettingsModal = ({
  onClose,
  isOpen,
}: Omit<React.ComponentProps<typeof Modal>, 'children'>) => {
  const t = useI18nContext();

  const dispatch = useDispatch();
  /**
   * The current slippage value in the quote request
   */
  const slippage = useSelector(getSlippage);

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [draftSlippageValue, setDraftSlippageValue] = useState<
    number | undefined
  >(slippage);

  /**
   * AUTO option shows for Solana-to-Solana swaps and any swap involving an RWA token.
   */
  const isSolanaSwap = useSelector(getIsSolanaSwap);
  const isRWASwap = useSelector(getIsRWASwap);
  const shouldShowAutoOption = isSolanaSwap || isRWASwap;

  // While clean, follow the store value; drafts only apply after the user edits.
  let slippageValue: number | undefined;
  if (isDirty) {
    slippageValue = draftSlippageValue;
  } else if (isOpen) {
    slippageValue = slippage;
  } else {
    slippageValue = undefined;
  }

  // Reset local draft UI when the modal closes (not during render).
  useEffect(() => {
    if (isOpen) {
      return undefined;
    }
    queueMicrotask(() => {
      setIsDirty(false);
      setInputValue('');
      setShowCustomInput(false);
    });
    return undefined;
  }, [isOpen]);

  const selectSlippageOption = (value: number | undefined) => {
    setDraftSlippageValue(value);
    setIsDirty(true);
  };

  const getNotificationConfig = () => {
    if (slippageValue === 100 && Number(inputValue) > 100) {
      return {
        severity: BannerAlertSeverity.Warning,
        text: t('swapSlippageCappedDescription'),
        title: t('swapSlippageHighTitle'),
      };
    }

    if (slippageValue === undefined) {
      return null;
    }

    if (slippageValue < 0.5) {
      return {
        severity: BannerAlertSeverity.Warning,
        text: t('swapSlippageLowDescription', [slippageValue]),
        title: t('swapSlippageLowTitle'),
      };
    }

    return null;
  };

  /**
   * Handles input field changes.
   * When the input field blurs, slippageValue is updated to the input's value.
   * The `bridge.slippage` state is only updated when the user clicks the Submit button
   *
   * @param event - The event that triggered the change
   * @param value - The incoming slippage value to validate and use
   */
  const handleCustomSlippage = (
    event:
      | React.ClipboardEvent<HTMLInputElement>
      | React.KeyboardEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLInputElement>,
    value: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setInputValue(sanitizeAmountInput(value, false));
  };

  const isCustomSlippage = !(
    slippageValue === undefined ||
    HARDCODED_SLIPPAGE_OPTIONS.includes(slippageValue)
  );

  const notificationConfig = getNotificationConfig();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{
            'data-testid': 'bridge__tx-settings-modal-close-button',
            ariaLabel: t('close'),
          }}
        >
          {t('transactionSettings')}
        </ModalHeader>
        <Box className="flex flex-col gap-3 px-4 pb-4">
          <Box className="flex items-center justify-start gap-1">
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {t('swapsMaxSlippage')}
            </Text>
            <Tooltip position={PopoverPosition.Top} style={{ zIndex: 1051 }}>
              {t('swapSlippageTooltip')}
            </Tooltip>
          </Box>
          <Box className="flex items-center justify-start gap-2">
            {shouldShowAutoOption && (
              <Button
                size={ButtonSize.Md}
                {...getSlippageOptionButtonProps(slippageValue === undefined)}
                onClick={() => {
                  selectSlippageOption(undefined);
                }}
              >
                {t('swapSlippageAutoDescription')}
              </Button>
            )}
            {HARDCODED_SLIPPAGE_OPTIONS.map((hardcodedSlippage) => {
              const isSelected = slippageValue === hardcodedSlippage;
              return (
                <Button
                  key={hardcodedSlippage}
                  size={ButtonSize.Md}
                  {...getSlippageOptionButtonProps(isSelected)}
                  onClick={() => {
                    selectSlippageOption(hardcodedSlippage);
                  }}
                >
                  {hardcodedSlippage}%
                </Button>
              );
            })}
            {!showCustomInput && (
              <Button
                size={ButtonSize.Md}
                data-testid="bridge__tx-settings-modal-custom-button"
                {...getSlippageOptionButtonProps(isCustomSlippage)}
                onClick={() => {
                  setInputValue(slippageValue?.toString() || '');
                  setShowCustomInput(true);
                }}
              >
                {isCustomSlippage ? `${slippageValue}%` : t('customSlippage')}
              </Button>
            )}
            {showCustomInput && (
              <TextField
                size={TextFieldSize.Md}
                className="w-24 border-muted bg-default"
                type={TextFieldType.Text}
                value={inputValue}
                autoFocus={true}
                onChange={(event) => {
                  handleCustomSlippage(event, event.target.value);
                }}
                onBlur={() => {
                  // If the user clicks outside the input, show the custom button
                  setShowCustomInput(false);
                  const newSlippage = Number(inputValue);
                  if (!isNaN(newSlippage) && inputValue.length > 0) {
                    const isCapped = newSlippage > 100;
                    selectSlippageOption(Math.min(newSlippage, 100));
                    if (!isCapped) {
                      setInputValue('');
                    }
                  }
                }}
                onFocus={() => {
                  setShowCustomInput(true);
                }}
                endAccessory={<Text variant={TextVariant.BodyMd}>%</Text>}
                inputProps={{
                  inputMode: 'decimal',
                  'data-testid': 'bridge__tx-settings-modal-custom-input',
                  onPaste: (event) => {
                    handleCustomSlippage(
                      event,
                      event.clipboardData.getData('text'),
                    );
                  },
                  onKeyDown: (event) => {
                    // Only allows digits and decimal points
                    if (
                      !sanitizeAmountInput(event.key) &&
                      event.key.length === 1
                    ) {
                      event.preventDefault();
                      event.stopPropagation();
                    }
                  },
                }}
              />
            )}
          </Box>
          {notificationConfig && (
            <Box marginTop={5}>
              <BannerAlert
                severity={notificationConfig.severity}
                title={notificationConfig.title}
                titleProps={{ 'data-testid': 'swaps-banner-title' }}
                description={notificationConfig.text}
              />
            </Box>
          )}
        </Box>
        <ModalFooter
          primaryButtonProps={{
            children: t('submit'),
            'data-testid': 'bridge__tx-settings-modal-submit-button',
            isDisabled:
              !isDirty ||
              (showCustomInput &&
                (isNaN(Number(inputValue)) || inputValue === '')),
            onClick: () => {
              dispatch(setSlippageUserOverride(slippageValue));
              onClose();
            },
          }}
        />
      </ModalContent>
    </Modal>
  );
};
