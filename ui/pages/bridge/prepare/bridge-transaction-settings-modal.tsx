import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
} from '../../../helpers/constants/design-system';
import { getSlippage } from '../../../ducks/bridge/selectors';
import { setSlippage } from '../../../ducks/bridge/actions';
import { useCrossChainSwapsEventTracker } from '../../../hooks/bridge/useCrossChainSwapsEventTracker';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { BRIDGE_DEFAULT_SLIPPAGE } from '../../../../shared/constants/bridge';
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
  const [customSlippage, setCustomSlippage] = useState<number | undefined>(
    slippage && HARDCODED_SLIPPAGE_OPTIONS.includes(slippage)
      ? undefined
      : slippage,
  );
  const [showCustomButton, setShowCustomButton] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = customSlippage?.toString() ?? '';
      inputRef.current.focus();
    }
  }, [customSlippage]);

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
                  onClick={() => {
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
            {showCustomButton ? (
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
                onClick={() => {
                  setShowCustomButton(false);
                  inputRef?.current?.focus();
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
            ) : (
              <TextField
                borderColor={BorderColor.primaryDefault}
                borderWidth={2}
                borderRadius={BorderRadius.pill}
                inputRef={inputRef}
                type={TextFieldType.Text}
                value={customSlippage}
                onChange={(e) => {
                  // Remove characters that are not numbers or decimal points if rendering a controlled or pasted value
                  const cleanedValue = e.target.value.replace(/[^0-9.]+/gu, '');
                  setLocalSlippage(undefined);
                  setCustomSlippage(Number(cleanedValue));
                }}
                autoFocus={true}
                onBlur={() => setShowCustomButton(true)}
                onKeyPress={(e?: React.KeyboardEvent<HTMLDivElement>) => {
                  // Only allow numbers and at most one decimal point
                  if (
                    e &&
                    !/^[0-9]*\.{0,1}[0-9]*$/u.test(
                      `${customSlippage ?? ''}${e.key}`,
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
                endAccessory={<Text variant={TextVariant.bodyMd}>%</Text>}
              />
            )}
          </Row>
        </Column>
        <ModalFooter>
          <ButtonPrimary
            width={BlockSize.Full}
            size={ButtonPrimarySize.Md}
            variant={TextVariant.bodyMd}
            disabled={(localSlippage || customSlippage) === slippage}
            onClick={() => {
              const newSlippage = localSlippage || customSlippage;
              newSlippage &&
                trackCrossChainSwapsEvent({
                  event: MetaMetricsEventName.InputChanged,
                  properties: {
                    input: 'slippage',
                    value: newSlippage.toString(),
                  },
                });
              dispatch(setSlippage(newSlippage));
              onClose();
            }}
          >
            {t('submit')}
          </ButtonPrimary>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
