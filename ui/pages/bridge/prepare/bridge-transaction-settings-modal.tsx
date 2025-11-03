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
  const isSolanaSwap = useSelector(getIsSolanaSwap);
  const slippage = useSelector(getSlippage);

  // AUTO option should only show for Solana-to-Solana swaps
  const shouldShowAutoOption = isSolanaSwap;

  const [localSlippage, setLocalSlippage] = useState<number | undefined>(
    undefined,
  );
  const [customSlippage, setCustomSlippage] = useState<string | undefined>(
    undefined,
  );
  const [showCustomButton, setShowCustomButton] = useState(true);
  const [isAutoSelected, setIsAutoSelected] = useState(false);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Simply display what's in the state
      if (shouldShowAutoOption && slippage === undefined) {
        setIsAutoSelected(true);
        setLocalSlippage(undefined);
        setCustomSlippage(undefined);
      } else {
        setIsAutoSelected(false);
        if (!slippage || slippage === 0) {
          // Default to first option if no slippage set, null, or 0
          // This handles undefined, null, 0, and other falsy values
          setLocalSlippage(SlippageValue.BridgeDefault);
          setCustomSlippage(undefined);
        } else if (HARDCODED_SLIPPAGE_OPTIONS.includes(slippage)) {
          setLocalSlippage(slippage);
          setCustomSlippage(undefined);
        } else {
          setLocalSlippage(undefined);
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

  const notificationConfig = getNotificationConfig();

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="bridge-settings-modal">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('transactionSettings')}</ModalHeader>
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
                  setLocalSlippage(undefined);
                  setCustomSlippage(undefined);
                  setIsAutoSelected(true);
                }}
              >
                {t('swapSlippageAutoDescription')}
              </Button>
            )}
            {HARDCODED_SLIPPAGE_OPTIONS.map((hardcodedSlippage) => {
              const isSelected =
                !isAutoSelected && localSlippage === hardcodedSlippage;
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
                    setLocalSlippage(hardcodedSlippage);
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
                borderRadius={BorderRadius.XL}
                type={TextFieldType.Text}
                value={customSlippage}
                onChange={(e) => {
                  const { value } = e.target;
                  if (value === '' || /^\d*[.,]?\d*$/u.test(value)) {
                    setLocalSlippage(undefined);
                    setCustomSlippage(value);
                    setIsAutoSelected(false);
                  }
                }}
                autoFocus={true}
                onBlur={() => {
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
            disabled={(() => {
              // Calculate what the new slippage would be
              const newSlippage = isAutoSelected
                ? undefined
                : (localSlippage ??
                  (customSlippage
                    ? Number(customSlippage.replace(',', '.'))
                    : undefined));

              // Button is disabled if nothing has changed
              return newSlippage === slippage;
            })()}
            onClick={() => {
              const newSlippage = isAutoSelected
                ? undefined
                : (localSlippage ?? Number(customSlippage?.replace(',', '.')));

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
