import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  PopoverPosition,
  Text,
  TextField,
  TextFieldType,
  BannerAlert,
  BannerAlertSeverity,
  Box,
  TextFieldSize,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BlockSize,
  BorderColor,
  JustifyContent,
  TextVariant,
  SEVERITIES,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import { getIsSolanaSwap, getSlippage } from '../../../ducks/bridge/selectors';
import { setSlippage } from '../../../ducks/bridge/actions';
import { SlippageValue } from '../utils/slippage-service';
import { Column, Row, Tooltip } from '../layout';
import { sanitizeAmountInput } from '../utils/quote';

const HARDCODED_SLIPPAGE_OPTIONS = [
  SlippageValue.EvmStablecoin,
  SlippageValue.BridgeDefault,
];

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

  /**
   * The custom slippage value typed or pasted by the user
   */
  const [customSlippage, setCustomSlippage] = useState<string | undefined>(
    undefined,
  );
  const [showCustomInput, setShowCustomInput] = useState(false);

  /**
   * AUTO option should only show for Solana-to-Solana swaps
   */
  const shouldShowAutoOption = useSelector(getIsSolanaSwap);

  const [slippageValue, setSlippageValue] = useState<number | undefined>(
    undefined,
  );

  // Initialize UI state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSlippageValue(slippage);
    }
  }, [slippage, shouldShowAutoOption, isOpen]);

  const getNotificationConfig = () => {
    if (!slippageValue) {
      return null;
    }

    if (slippageValue < 0.5) {
      return {
        severity: SEVERITIES.WARNING,
        text: t('swapSlippageLowDescription', [slippageValue]),
        title: t('swapSlippageLowTitle'),
      };
    }

    return null;
  };

  /**
   * Sets input field's display value (customSlippage).
   * When the input field blurs, slippageValue is updated to customSlippage's value.
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
    const sanitizedValue = sanitizeAmountInput(value, false);
    setCustomSlippage(sanitizedValue || undefined);
  };

  const isCustomSlippage = !(
    slippageValue === undefined ||
    HARDCODED_SLIPPAGE_OPTIONS.includes(slippageValue)
  );

  const notificationConfig = getNotificationConfig();

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="bridge-settings-modal">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{
            'data-testid': 'bridge__tx-settings-modal-close-button',
          }}
        >
          {t('transactionSettings')}
        </ModalHeader>
        <Column gap={3} paddingInline={4} paddingBottom={4}>
          <Row gap={1} justifyContent={JustifyContent.flexStart}>
            <Text variant={TextVariant.bodyMdMedium}>
              {t('swapsMaxSlippage')}
            </Text>
            <Tooltip position={PopoverPosition.Top} style={{ zIndex: 1051 }}>
              {t('swapSlippageTooltip')}
            </Tooltip>
          </Row>
          <Row gap={2} justifyContent={JustifyContent.flexStart}>
            {shouldShowAutoOption && (
              <Button
                size={ButtonSize.Md}
                variant={
                  slippageValue === undefined
                    ? ButtonVariant.Primary
                    : ButtonVariant.Secondary
                }
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSlippageValue(undefined);
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
                  variant={
                    isSelected ? ButtonVariant.Primary : ButtonVariant.Secondary
                  }
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSlippageValue(hardcodedSlippage);
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
                variant={
                  isCustomSlippage
                    ? ButtonVariant.Primary
                    : ButtonVariant.Secondary
                }
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCustomInput(true);
                }}
              >
                {isCustomSlippage ? `${slippageValue}%` : t('customSlippage')}
              </Button>
            )}
            {showCustomInput && (
              <TextField
                size={TextFieldSize.Md}
                borderColor={BorderColor.borderMuted}
                testId="bridge__tx-settings-modal-custom-input"
                borderRadius={BorderRadius.XL}
                type={TextFieldType.Text}
                value={customSlippage}
                onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                  handleCustomSlippage(e, e.clipboardData.getData('text'));
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  // Only allows digits and decimal points
                  if (sanitizeAmountInput(e.key)) {
                    handleCustomSlippage(e, (customSlippage ?? '') + e.key);
                  } else if (e.key.length === 1) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                onChange={(e) => {
                  handleCustomSlippage(e, e.target.value);
                }}
                autoFocus={true}
                onBlur={() => {
                  // If the user clicks outside the input, show the custom button
                  setShowCustomInput(false);
                  const newSlippage = Number(customSlippage);
                  if (isNaN(newSlippage)) {
                    setCustomSlippage(undefined);
                  } else {
                    setSlippageValue(newSlippage);
                  }
                }}
                onFocus={() => {
                  setShowCustomInput(true);
                }}
                endAccessory={<Text variant={TextVariant.bodyMd}>%</Text>}
              />
            )}
          </Row>
          {notificationConfig && (
            <Box marginTop={5}>
              <BannerAlert
                severity={notificationConfig.severity as BannerAlertSeverity}
                title={notificationConfig.title}
                titleProps={{ 'data-testid': 'swaps-banner-title' }}
              >
                <Text>{notificationConfig.text}</Text>
              </BannerAlert>
            </Box>
          )}
        </Column>
        <ModalFooter>
          <Button
            width={BlockSize.Full}
            size={ButtonSize.Lg}
            variant={ButtonVariant.Primary}
            data-testid="bridge__tx-settings-modal-submit-button"
            disabled={
              // Disable Submit if there is no change in slippage value
              slippageValue === slippage &&
              // Disable Submit until the custom slippage is a number
              (showCustomInput ? isNaN(Number(customSlippage)) : true)
            }
            onClick={() => {
              dispatch(setSlippage(slippageValue));
              onClose();
            }}
          >
            {t('submit')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
