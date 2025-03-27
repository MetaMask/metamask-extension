import React, { useState } from 'react';
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
import { getSlippage } from '../../../ducks/bridge/selectors';
import { setSlippage } from '../../../ducks/bridge/actions';
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

  const slippage = useSelector(getSlippage);

  const [localSlippage, setLocalSlippage] = useState<number | undefined>(
    slippage,
  );
  const [customSlippage, setCustomSlippage] = useState<string | undefined>(
    slippage && !HARDCODED_SLIPPAGE_OPTIONS.includes(slippage)
      ? slippage.toString()
      : undefined,
  );
  const [showCustomButton, setShowCustomButton] = useState(true);

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
            {HARDCODED_SLIPPAGE_OPTIONS.map((hardcodedSlippage) => {
              return (
                <Button
                  key={hardcodedSlippage}
                  size={ButtonSize.Sm}
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLocalSlippage(hardcodedSlippage);
                    setCustomSlippage(undefined);
                  }}
                  variant={ButtonVariant.Secondary}
                  borderColor={
                    localSlippage === hardcodedSlippage && showCustomButton
                      ? BorderColor.primaryDefault
                      : BorderColor.borderDefault
                  }
                  borderWidth={
                    localSlippage === hardcodedSlippage && showCustomButton
                      ? 2
                      : 1
                  }
                  backgroundColor={
                    localSlippage === hardcodedSlippage && showCustomButton
                      ? BackgroundColor.primaryMuted
                      : BackgroundColor.backgroundDefault
                  }
                >
                  <Text
                    color={
                      localSlippage === hardcodedSlippage && showCustomButton
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
              (customSlippage !== undefined &&
                Number(customSlippage.replace(',', '.')) === slippage) ||
              (localSlippage !== undefined && localSlippage === slippage)
            }
            onClick={() => {
              const newSlippage =
                localSlippage ?? Number(customSlippage?.replace(',', '.'));
              if (newSlippage) {
                trackCrossChainSwapsEvent({
                  event: MetaMetricsEventName.InputChanged,
                  properties: {
                    input: 'slippage',
                    value: newSlippage.toString(),
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
