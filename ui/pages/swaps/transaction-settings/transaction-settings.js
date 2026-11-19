import React, { useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'clsx';

import { Text, TextVariant } from '@metamask/design-system-react';
import { I18nContext } from '../../../contexts/i18n';
import ButtonGroup from '../../../components/ui/button-group';
import Button from '../../../components/ui/button';
import InfoTooltip from '../../../components/ui/info-tooltip';
import Box from '../../../components/ui/box';

import {
  AlignItems,
  JustifyContent,
  DISPLAY,
  Severity,
  FlexDirection,
  BlockSize,
} from '../../../helpers/constants/design-system';
import {
  Slippage,
  SLIPPAGE_VERY_HIGH_ERROR,
  SLIPPAGE_NEGATIVE_ERROR,
  isStablePair,
} from '../../../../shared/constants/swaps';
import {
  BannerAlert,
  Modal,
  ModalOverlay,
  ButtonPrimary,
} from '../../../components/component-library';
import { ModalContent } from '../../../components/component-library/modal-content/deprecated';
import { ModalHeader } from '../../../components/component-library/modal-header/deprecated';
import { setSwapsErrorKey } from '../../../store/actions';
import { getSwapsErrorKey } from '../../../ducks/swaps/swaps';
import { useDispatch } from '../../../store/hooks';

const NO_NOTIFICATION = {
  severity: Severity.Info,
  text: '',
  title: '',
  errorKey: null,
};

/**
 * Builds the slippage notification banner content, along with the swaps error
 * key the entered value implies.
 *
 * @param options - The current slippage state.
 * @param options.t - The i18n translation function.
 * @param options.customValue - The custom slippage input, as a string e.g. '0'.
 * @param options.newSlippage - The slippage that would be applied on submit.
 * @param options.maxAllowedSlippage - The highest slippage quotes support.
 * @param options.isSlippageCapped - Whether the entered value was reduced to the 100% maximum.
 * @returns The banner severity and copy, plus the error key to store. A `null`
 * error key leaves the currently stored key untouched.
 */
function getSlippageNotification({
  t,
  customValue,
  newSlippage,
  maxAllowedSlippage,
  isSlippageCapped,
}) {
  if (isSlippageCapped) {
    return {
      severity: Severity.Danger,
      text: t('swapSlippageCappedDescription'),
      title: t('swapSlippageOverLimitTitle'),
      errorKey: SLIPPAGE_VERY_HIGH_ERROR,
    };
  }

  if (!customValue) {
    return NO_NOTIFICATION;
  }

  const value = Number(customValue);

  if (value < 0) {
    return {
      severity: Severity.Danger,
      text: t('swapSlippageNegativeDescription'),
      title: t('swapSlippageNegativeTitle'),
      errorKey: SLIPPAGE_NEGATIVE_ERROR,
    };
  }

  // We will not show the low warning for 0% slippage, because we will only
  // return non-slippage quotes from off-chain makers.
  if (value > 0 && value <= 1) {
    return {
      severity: Severity.Warning,
      text: t('swapSlippageLowDescription', [newSlippage]),
      title: t('swapSlippageLowTitle'),
      errorKey: null,
    };
  }

  if (value >= 5 && value <= maxAllowedSlippage) {
    return {
      severity: Severity.Warning,
      text: t('swapSlippageHighDescription', [newSlippage]),
      title: t('swapSlippageHighTitle'),
      errorKey: null,
    };
  }

  if (value > maxAllowedSlippage) {
    return {
      severity: Severity.Danger,
      text: t('swapSlippageOverLimitDescription'),
      title: t('swapSlippageOverLimitTitle'),
      errorKey: SLIPPAGE_VERY_HIGH_ERROR,
    };
  }

  if (value === 0) {
    return {
      severity: Severity.Info,
      text: t('swapSlippageZeroDescription'),
      title: t('swapSlippageZeroTitle'),
      errorKey: null,
    };
  }

  return { ...NO_NOTIFICATION, errorKey: '' };
}

export default function TransactionSettings({
  onSelect,
  onModalClose,
  maxAllowedSlippage,
  currentSlippage,
  isDirectWrappingEnabled,
  sourceTokenSymbol,
  destinationTokenSymbol,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const swapsErrorKey = useSelector(getSwapsErrorKey);
  const [customValue, setCustomValue] = useState(() => {
    if (
      typeof currentSlippage === 'number' &&
      !Object.values(Slippage).includes(currentSlippage)
    ) {
      return currentSlippage.toString();
    }
    return '';
  });
  const [enteringCustomValue, setEnteringCustomValue] = useState(false);
  const [activeButtonIndex, setActiveButtonIndex] = useState(() => {
    if (currentSlippage === Slippage.high) {
      return 1; // 3% slippage.
    } else if (currentSlippage === Slippage.default) {
      return 0; // 2% slippage.
    } else if (currentSlippage === Slippage.stable) {
      return 0; // 0.5% slippage for stable pairs.
    } else if (typeof currentSlippage === 'number') {
      return 2; // Custom slippage.
    }
    return 0;
  });
  const [inputRef, setInputRef] = useState(null);
  const [newSlippage, setNewSlippage] = useState(currentSlippage);
  const [isSlippageCapped, setIsSlippageCapped] = useState(false);

  const didFormChange = newSlippage !== currentSlippage;

  const finishEnteringCustomValue = () => {
    const numericValue = Number(customValue);
    const isCapped = customValue !== '' && numericValue > 100;
    if (isCapped) {
      setCustomValue('100');
      setNewSlippage(100);
    }
    setIsSlippageCapped(isCapped);
    setEnteringCustomValue(false);
  };

  const updateTransactionSettings = () => {
    if (newSlippage !== currentSlippage) {
      onSelect(newSlippage);
    }
  };

  const {
    severity: notificationSeverity,
    text: notificationText,
    title: notificationTitle,
    errorKey: notificationErrorKey,
  } = getSlippageNotification({
    t,
    customValue,
    newSlippage,
    maxAllowedSlippage,
    isSlippageCapped,
  });

  if (notificationErrorKey !== null && notificationErrorKey !== swapsErrorKey) {
    dispatch(setSwapsErrorKey(notificationErrorKey));
  }

  const isDangerSeverity = notificationSeverity === Severity.Danger;

  const customValueText = customValue || t('swapCustom');

  useEffect(() => {
    if (
      inputRef &&
      enteringCustomValue &&
      window.document.activeElement !== inputRef
    ) {
      inputRef.focus();
    }
  }, [inputRef, enteringCustomValue]);

  useEffect(() => {
    if (activeButtonIndex !== 2) {
      // If it's not a custom slippage, remove an error key.
      dispatch(setSwapsErrorKey(''));
    }
  }, [dispatch, activeButtonIndex]);

  return (
    <Modal
      onClose={onModalClose}
      isOpen
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey
      className="mm-modal__custom-scrollbar"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onModalClose}>
          {t('transactionSettings')}
        </ModalHeader>
        <Box
          display={DISPLAY.FLEX}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.stretch}
          className="transaction-settings__content"
        >
          <Box marginTop={7} marginBottom={5}>
            <>
              {!isDirectWrappingEnabled && (
                <>
                  <Box
                    display={DISPLAY.FLEX}
                    alignItems={AlignItems.center}
                    marginBottom={2}
                  >
                    <Text variant={TextVariant.bodySm} className="pr-2">
                      {t('swapsMaxSlippage')}
                    </Text>
                    <InfoTooltip
                      position="top"
                      iconFillColor="var(--color-icon-muted)"
                      contentText={t('swapSlippageTooltip')}
                    />
                  </Box>
                  <ButtonGroup
                    defaultActiveButtonIndex={
                      activeButtonIndex === 2 && !customValue
                        ? 1
                        : activeButtonIndex
                    }
                    variant="radiogroup"
                    newActiveButtonIndex={activeButtonIndex}
                    className={classnames('transaction-settings__button-group')}
                    style={{ width: BlockSize.Half }}
                  >
                    <Button
                      onClick={() => {
                        setCustomValue('');
                        setIsSlippageCapped(false);
                        setEnteringCustomValue(false);
                        setActiveButtonIndex(0);
                        setNewSlippage(
                          isStablePair(
                            sourceTokenSymbol,
                            destinationTokenSymbol,
                          )
                            ? Slippage.stable
                            : Slippage.default,
                        );
                      }}
                    >
                      {t('swapSlippagePercent', [
                        isStablePair(sourceTokenSymbol, destinationTokenSymbol)
                          ? Slippage.stable
                          : Slippage.default,
                      ])}
                    </Button>
                    <Button
                      onClick={() => {
                        setCustomValue('');
                        setIsSlippageCapped(false);
                        setEnteringCustomValue(false);
                        setActiveButtonIndex(1);
                        setNewSlippage(Slippage.high);
                      }}
                    >
                      {t('swapSlippagePercent', [Slippage.high])}
                    </Button>
                    <Button
                      className={classnames(
                        'transaction-settings__button-group-custom-button',
                        {
                          'radio-button--danger': isDangerSeverity,
                        },
                      )}
                      onClick={() => {
                        setActiveButtonIndex(2);
                        setEnteringCustomValue(true);
                      }}
                    >
                      {enteringCustomValue ? (
                        <div
                          className={classnames(
                            'transaction-settings__custom-input',
                            {
                              'transaction-settings__custom-input--danger':
                                isDangerSeverity,
                            },
                          )}
                        >
                          <input
                            data-testid="transaction-settings-custom-slippage"
                            inputMode="decimal"
                            onChange={(event) => {
                              const { value } = event.target;
                              const isValueNumeric = !isNaN(Number(value));
                              if (isValueNumeric) {
                                setIsSlippageCapped(false);
                                setCustomValue(value);
                                setNewSlippage(Number(value));
                              }
                            }}
                            type="text"
                            maxLength="4"
                            ref={setInputRef}
                            onBlur={finishEnteringCustomValue}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                finishEnteringCustomValue();
                              }
                            }}
                            value={customValue || ''}
                          />
                        </div>
                      ) : (
                        customValueText
                      )}
                      {(customValue || enteringCustomValue) && (
                        <div className="transaction-settings__percentage-suffix">
                          %
                        </div>
                      )}
                    </Button>
                  </ButtonGroup>
                </>
              )}
            </>
            {notificationText && (
              <BannerAlert
                severity={notificationSeverity}
                title={notificationTitle}
                titleProps={{ 'data-testid': 'swaps-banner-title' }}
                description={notificationText}
                marginTop={5}
              />
            )}
          </Box>
          <Box marginTop={5}>
            <ButtonPrimary
              onClick={() => {
                updateTransactionSettings();
                onModalClose();
              }}
              block
              disabled={!didFormChange}
              data-testid="update-transaction-settings-button"
            >
              {t('update')}
            </ButtonPrimary>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}

TransactionSettings.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onModalClose: PropTypes.func.isRequired,
  maxAllowedSlippage: PropTypes.number.isRequired,
  currentSlippage: PropTypes.number,
  isDirectWrappingEnabled: PropTypes.bool,
  sourceTokenSymbol: PropTypes.string,
  destinationTokenSymbol: PropTypes.string,
};
