import React, { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { I18nContext } from '../../../contexts/i18n';
import ButtonGroup from '../../../components/ui/button-group';
import Button from '../../../components/ui/button';
import InfoTooltip from '../../../components/ui/info-tooltip';
import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography';
import {
  TypographyVariant,
  AlignItems,
  JustifyContent,
  DISPLAY,
  SEVERITIES,
  FlexDirection,
  BlockSize,
} from '../../../helpers/constants/design-system';
import {
  Slippage,
  SLIPPAGE_VERY_HIGH_ERROR,
  SLIPPAGE_NEGATIVE_ERROR,
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

export default function TransactionSettings({
  onSelect,
  onModalClose,
  maxAllowedSlippage,
  currentSlippage,
  isDirectWrappingEnabled,
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
    } else if (typeof currentSlippage === 'number') {
      return 2; // Custom slippage.
    }
    return 0;
  });
  const [inputRef, setInputRef] = useState(null);
  const [newSlippage, setNewSlippage] = useState(currentSlippage);

  const didFormChange = newSlippage !== currentSlippage;

  const updateTransactionSettings = () => {
    if (newSlippage !== currentSlippage) {
      onSelect(newSlippage);
    }
  };

  let notificationText = '';
  let notificationTitle = '';
  let notificationSeverity = SEVERITIES.INFO;
  if (customValue) {
    // customValue is a string, e.g. '0'
    if (Number(customValue) < 0) {
      notificationSeverity = SEVERITIES.DANGER;
      notificationText = t('swapSlippageNegativeDescription');
      notificationTitle = t('swapSlippageNegativeTitle');
      dispatch(setSwapsErrorKey(SLIPPAGE_NEGATIVE_ERROR));
    } else if (Number(customValue) > 0 && Number(customValue) <= 1) {
      // We will not show this warning for 0% slippage, because we will only
      // return non-slippage quotes from off-chain makers.
      notificationSeverity = SEVERITIES.WARNING;
      notificationText = t('swapSlippageLowDescription', [newSlippage]);
      notificationTitle = t('swapSlippageLowTitle');
    } else if (
      Number(customValue) >= 5 &&
      Number(customValue) <= maxAllowedSlippage
    ) {
      notificationSeverity = SEVERITIES.WARNING;
      notificationText = t('swapSlippageHighDescription', [newSlippage]);
      notificationTitle = t('swapSlippageHighTitle');
    } else if (Number(customValue) > maxAllowedSlippage) {
      notificationSeverity = SEVERITIES.DANGER;
      notificationText = t('swapSlippageOverLimitDescription');
      notificationTitle = t('swapSlippageOverLimitTitle');
      dispatch(setSwapsErrorKey(SLIPPAGE_VERY_HIGH_ERROR));
    } else if (Number(customValue) === 0) {
      notificationSeverity = SEVERITIES.INFO;
      notificationText = t('swapSlippageZeroDescription');
      notificationTitle = t('swapSlippageZeroTitle');
    } else if (swapsErrorKey) {
      dispatch(setSwapsErrorKey(''));
    }
  }
  const isDangerSeverity = notificationSeverity === SEVERITIES.DANGER;

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
                  <Box display={DISPLAY.FLEX} alignItems={AlignItems.center}>
                    <Typography
                      variant={TypographyVariant.H6}
                      boxProps={{ paddingRight: 2 }}
                    >
                      {t('swapsMaxSlippage')}
                    </Typography>
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
                        setEnteringCustomValue(false);
                        setActiveButtonIndex(0);
                        setNewSlippage(Slippage.default);
                      }}
                    >
                      {t('swapSlippagePercent', [Slippage.default])}
                    </Button>
                    <Button
                      onClick={() => {
                        setCustomValue('');
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
                            onChange={(event) => {
                              const { value } = event.target;
                              const isValueNumeric = !isNaN(Number(value));
                              if (isValueNumeric) {
                                setCustomValue(value);
                                setNewSlippage(Number(value));
                              }
                            }}
                            type="text"
                            maxLength="4"
                            ref={setInputRef}
                            onBlur={() => {
                              setEnteringCustomValue(false);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                setEnteringCustomValue(false);
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
              <Box marginTop={5}>
                <BannerAlert
                  severity={notificationSeverity}
                  title={notificationTitle}
                  titleProps={{ 'data-testid': 'swaps-banner-title' }}
                >
                  <Typography
                    variant={TypographyVariant.H6}
                    testId="mm-banner-alert-notification-text"
                  >
                    {notificationText}
                  </Typography>
                </BannerAlert>
              </Box>
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
};
