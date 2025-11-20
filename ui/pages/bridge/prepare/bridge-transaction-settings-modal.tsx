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
   * A slippage value selected by clicking on one of the hardcoded options
   */
  const [selectedSlippageOption, setSelectedSlippageOption] = useState<
    number | undefined
  >(undefined);
  /**
   * A custom slippage value typed or pasted by the user
   */
  const [customSlippage, setCustomSlippage] = useState<string | undefined>(
    undefined,
  );
  const [showCustomButton, setShowCustomButton] = useState(true);
  // AUTO option should only show for Solana-to-Solana swaps
  const shouldShowAutoOption = useSelector(getIsSolanaSwap);
  const [isAutoSelected, setIsAutoSelected] = useState(false);

  // Initialize UI state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (slippage === undefined) {
        if (shouldShowAutoOption) {
          setIsAutoSelected(true);
          setSelectedSlippageOption(undefined);
          setCustomSlippage(undefined);
        }
        // Slippage is only undefined when swapping on Solana
        // Do nothing here to prevent displaying an inaccurate slippage value
      } else {
        setIsAutoSelected(false);
        if (HARDCODED_SLIPPAGE_OPTIONS.includes(slippage)) {
          setSelectedSlippageOption(slippage);
          setCustomSlippage(undefined);
        } else {
          setSelectedSlippageOption(undefined);
          setCustomSlippage(slippage.toString());
        }
      }
    }
  }, [slippage, shouldShowAutoOption, isOpen]);

  const getNotificationConfig = () => {
    if (!customSlippage) {
      return null;
    }

    const slippageValue = Number(customSlippage.replace(',', '.'));
    if (slippageValue < 0.5) {
      return {
        severity: SEVERITIES.WARNING,
        text: t('swapSlippageLowDescription', [slippageValue]),
        title: t('swapSlippageLowTitle'),
      };
    }

    return null;
  };

  const handleCustomSlippage = (
    event:
      | React.ClipboardEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLInputElement>,
    value: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const sanitizedValue = sanitizeAmountInput(value);
    setSelectedSlippageOption(undefined);
    setCustomSlippage(sanitizedValue || undefined);
    setIsAutoSelected(false);
  };

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
                  isAutoSelected
                    ? ButtonVariant.Primary
                    : ButtonVariant.Secondary
                }
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedSlippageOption(undefined);
                  setCustomSlippage(undefined);
                  setIsAutoSelected(true);
                }}
              >
                {t('swapSlippageAutoDescription')}
              </Button>
            )}
            {HARDCODED_SLIPPAGE_OPTIONS.map((hardcodedSlippage) => {
              const isSelected =
                !isAutoSelected && selectedSlippageOption === hardcodedSlippage;
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
                    setSelectedSlippageOption(hardcodedSlippage);
                    setCustomSlippage(undefined);
                    setIsAutoSelected(false);
                  }}
                >
                  {hardcodedSlippage}%
                </Button>
              );
            })}
            {showCustomButton && (
              <Button
                size={ButtonSize.Md}
                data-testid="bridge__tx-settings-modal-custom-button"
                variant={
                  customSlippage === undefined
                    ? ButtonVariant.Secondary
                    : ButtonVariant.Primary
                }
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCustomButton(false);
                  setIsAutoSelected(false);
                  setSelectedSlippageOption(undefined);
                }}
              >
                {customSlippage === undefined
                  ? t('customSlippage')
                  : `${customSlippage}%`}
              </Button>
            )}
            {!showCustomButton && (
              <TextField
                size={TextFieldSize.Md}
                borderColor={BorderColor.borderMuted}
                testId="bridge__tx-settings-modal-custom-input"
                borderRadius={BorderRadius.XL}
                type={TextFieldType.Text}
                value={customSlippage}
                onKeyDown={(e) => {
                  const updatedCustomSlippage = [customSlippage, e.key]
                    .filter(Boolean)
                    .join('');
                  // If the resulting custom slippage is invalid, don't propagate the keypress
                  if (!sanitizeAmountInput(updatedCustomSlippage)) {
                    e.preventDefault();
                  }
                }}
                onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                  handleCustomSlippage(e, e.clipboardData.getData('text'));
                }}
                onChange={(e) => {
                  handleCustomSlippage(e, e.target.value);
                }}
                autoFocus={true}
                onBlur={() => {
                  // If the user clicks outside the input, show the custom button
                  setShowCustomButton(true);
                }}
                onFocus={() => {
                  setShowCustomButton(false);
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
            disabled={(() => {
              if (isAutoSelected && slippage !== undefined) {
                return false;
              }
              if (
                selectedSlippageOption !== undefined &&
                selectedSlippageOption !== slippage
              ) {
                return false;
              }
              const customSlippageNumber = Number(customSlippage);
              if (
                isNaN(customSlippageNumber) ||
                customSlippageNumber === slippage ||
                customSlippage === ''
              ) {
                return true;
              }
              return false;
            })()}
            onClick={() => {
              const newSlippage = isAutoSelected
                ? undefined
                : (selectedSlippageOption ?? Number(customSlippage));

              if (newSlippage !== slippage) {
                dispatch(setSlippage(newSlippage));
                onClose();
              }
            }}
          >
            {t('submit')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
