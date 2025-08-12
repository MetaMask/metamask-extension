import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BRIDGE_DEFAULT_SLIPPAGE } from '@metamask/bridge-controller';
import {
  Button,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonSize,
  ButtonVariant,
  IconName,
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
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  JustifyContent,
  TextColor,
  TextVariant,
  SEVERITIES,
} from '../../../helpers/constants/design-system';
import { getIsSolanaSwap, getSlippage } from '../../../ducks/bridge/selectors';
import { setSlippage } from '../../../ducks/bridge/actions';
import { useCrossChainSwapsEventTracker } from '../../../hooks/bridge/useCrossChainSwapsEventTracker';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { Column, Row, Tooltip } from '../layout';

const HARDCODED_SLIPPAGE_OPTIONS = [BRIDGE_DEFAULT_SLIPPAGE, 2];

export const BridgeTransactionSettingsModal = ({
  onClose,
  isOpen,
}: Omit<React.ComponentProps<typeof Modal>, 'children'>) => {
  const t = useI18nContext();
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();

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
          setLocalSlippage(BRIDGE_DEFAULT_SLIPPAGE);
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
        <Column gap={3} padding={4}>
          <Row gap={1} justifyContent={JustifyContent.flexStart}>
            <Text>{t('swapsMaxSlippage')}</Text>
            <Tooltip
              position={PopoverPosition.Top}
              iconName={IconName.Info}
              style={{ zIndex: 1051 }}
            >
              {t('swapSlippageTooltip')}
            </Tooltip>
          </Row>
          <Row gap={2} justifyContent={JustifyContent.flexStart}>
            {shouldShowAutoOption && (
              <Button
                size={ButtonSize.Sm}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLocalSlippage(undefined);
                  setCustomSlippage(undefined);
                  setIsAutoSelected(true);
                }}
                variant={ButtonVariant.Secondary}
                borderColor={
                  isAutoSelected
                    ? BorderColor.primaryDefault
                    : BorderColor.borderDefault
                }
                borderWidth={isAutoSelected ? 2 : 1}
                backgroundColor={
                  isAutoSelected
                    ? BackgroundColor.primaryMuted
                    : BackgroundColor.backgroundDefault
                }
              >
                <Text
                  color={
                    isAutoSelected
                      ? TextColor.primaryDefault
                      : TextColor.textDefault
                  }
                >
                  {t('swapSlippageAutoDescription')}
                </Text>
              </Button>
            )}
            {HARDCODED_SLIPPAGE_OPTIONS.map((hardcodedSlippage) => {
              const isSelected =
                !isAutoSelected && localSlippage === hardcodedSlippage;
              return (
                <Button
                  key={hardcodedSlippage}
                  size={ButtonSize.Sm}
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLocalSlippage(hardcodedSlippage);
                    setCustomSlippage(undefined);
                    setIsAutoSelected(false);
                  }}
                  variant={ButtonVariant.Secondary}
                  borderColor={
                    isSelected
                      ? BorderColor.primaryDefault
                      : BorderColor.borderDefault
                  }
                  borderWidth={isSelected ? 2 : 1}
                  backgroundColor={
                    isSelected
                      ? BackgroundColor.primaryMuted
                      : BackgroundColor.backgroundDefault
                  }
                >
                  <Text
                    color={
                      isSelected
                        ? TextColor.primaryDefault
                        : TextColor.textDefault
                    }
                  >
                    {hardcodedSlippage}%
                  </Text>
                </Button>
              );
            })}
            {showCustomButton && (
              <Button
                size={ButtonSize.Sm}
                variant={ButtonVariant.Secondary}
                borderColor={
                  customSlippage === undefined
                    ? BorderColor.borderDefault
                    : BorderColor.primaryDefault
                }
                borderWidth={customSlippage === undefined ? 1 : 2}
                backgroundColor={
                  customSlippage === undefined
                    ? BackgroundColor.backgroundDefault
                    : BackgroundColor.primaryMuted
                }
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCustomButton(false);
                  setIsAutoSelected(false);
                }}
              >
                <Text
                  color={
                    customSlippage === undefined
                      ? TextColor.textDefault
                      : TextColor.primaryDefault
                  }
                >
                  {customSlippage === undefined
                    ? t('customSlippage')
                    : `${customSlippage}%`}
                </Text>
              </Button>
            )}
            {!showCustomButton && (
              <TextField
                borderColor={BorderColor.primaryDefault}
                borderWidth={2}
                borderRadius={BorderRadius.pill}
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
          <ButtonPrimary
            width={BlockSize.Full}
            size={ButtonPrimarySize.Md}
            variant={TextVariant.bodyMd}
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
                trackCrossChainSwapsEvent({
                  event: MetaMetricsEventName.InputChanged,
                  properties: {
                    input: 'slippage',
                    value: newSlippage?.toString() ?? 'auto',
                  },
                });

                dispatch(setSlippage(newSlippage));
                onClose();
              }
            }}
          >
            {t('submit')}
          </ButtonPrimary>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
