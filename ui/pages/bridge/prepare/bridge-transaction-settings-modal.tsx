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
import {
  getIsSolanaSwap,
  getEffectiveSlippage,
} from '../../../ducks/bridge/selectors';
import { setSlippage } from '../../../ducks/bridge/actions';
import { setSolanaSlippage } from '../../../store/actions';
import { useCrossChainSwapsEventTracker } from '../../../hooks/bridge/useCrossChainSwapsEventTracker';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { Column, Row, Tooltip } from '../layout';

const HARDCODED_SLIPPAGE_OPTIONS = [BRIDGE_DEFAULT_SLIPPAGE, 3];

export const BridgeTransactionSettingsModal = ({
  onClose,
  isOpen,
}: Omit<React.ComponentProps<typeof Modal>, 'children'>) => {
  const t = useI18nContext();
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();

  const dispatch = useDispatch();
  const isSolanaSwap = useSelector(getIsSolanaSwap);
  const slippage = useSelector(getEffectiveSlippage);

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
      // Note: We check for both null and undefined since JSON serialization converts undefined to null
      const shouldSelectAuto =
        (slippage === null || slippage === undefined) && shouldShowAutoOption;
      setIsAutoSelected(shouldSelectAuto);
      setLocalSlippage(shouldSelectAuto ? undefined : slippage);
      setCustomSlippage(
        slippage && !HARDCODED_SLIPPAGE_OPTIONS.includes(slippage)
          ? slippage.toString()
          : undefined,
      );
    }
  }, [slippage, shouldShowAutoOption, isOpen, isSolanaSwap]);

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
            disabled={
              (isAutoSelected &&
                (slippage === null || slippage === undefined)) ||
              (!isAutoSelected &&
                ((customSlippage !== undefined &&
                  Number(customSlippage.replace(',', '.')) === slippage) ||
                  (localSlippage !== undefined && localSlippage === slippage)))
            }
            onClick={() => {
              const newSlippage = isAutoSelected
                ? undefined
                : localSlippage ?? Number(customSlippage?.replace(',', '.'));

              if (newSlippage !== undefined || isAutoSelected) {
                trackCrossChainSwapsEvent({
                  event: MetaMetricsEventName.InputChanged,
                  properties: {
                    input: 'slippage',
                    value: newSlippage?.toString() ?? 'auto',
                  },
                });

                if (isSolanaSwap) {
                  dispatch(setSolanaSlippage(newSlippage));
                } else {
                  dispatch(setSlippage(newSlippage));
                }
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
