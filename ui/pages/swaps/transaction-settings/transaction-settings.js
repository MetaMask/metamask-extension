import React, { useState, useEffect, useContext } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { I18nContext } from '../../../contexts/i18n';
import ButtonGroup from '../../../components/ui/button-group';
import Button from '../../../components/ui/button';
import InfoTooltip from '../../../components/ui/info-tooltip';
import ToggleButton from '../../../components/ui/toggle-button';
import Box from '../../../components/ui/box';
import Popover from '../../../components/ui/popover';
import Typography from '../../../components/ui/typography';
import {
  TypographyVariant,
  AlignItems,
  JustifyContent,
  DISPLAY,
  SEVERITIES,
} from '../../../helpers/constants/design-system';
import { getTranslatedStxErrorMessage } from '../swaps.util';
import {
  Slippage,
  SLIPPAGE_OVER_LIMIT_ERROR,
  SLIPPAGE_NEGATIVE_ERROR,
} from '../../../../shared/constants/swaps';
import { BannerAlert } from '../../../components/component-library/banner-alert';
import { setSwapsErrorKey } from '../../../store/actions';

export default function TransactionSettings({
  onSelect,
  onModalClose,
  maxAllowedSlippage,
  currentSlippage,
  smartTransactionsEnabled,
  smartTransactionsOptInStatus,
  setSmartTransactionsOptInStatus,
  currentSmartTransactionsError,
  isDirectWrappingEnabled,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
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
      notificationText = t('swapSlippageTooLowDescription');
      notificationTitle = t('swapSlippageTooLowTitle');
    } else if (
      Number(customValue) >= 5 &&
      Number(customValue) <= maxAllowedSlippage
    ) {
      notificationSeverity = SEVERITIES.WARNING;
      notificationText = t('swapSlippageVeryHighDescription');
      notificationTitle = t('swapSlippageVeryHighTitle');
    } else if (Number(customValue) > maxAllowedSlippage) {
      notificationSeverity = SEVERITIES.DANGER;
      notificationText = t('swapSlippageOverLimitDescription');
      notificationTitle = t('swapSlippageOverLimitTitle');
      dispatch(setSwapsErrorKey(SLIPPAGE_OVER_LIMIT_ERROR));
    } else if (Number(customValue) === 0) {
      notificationSeverity = SEVERITIES.INFO;
      notificationText = t('swapSlippageZeroDescription');
      notificationTitle = t('swapSlippageZeroTitle');
    } else {
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
  }, [activeButtonIndex]);

  return (
    <div className="transaction-settings">
      <Popover title={t('transactionSettings')} onClose={() => onModalClose()}>
        <div className="transaction-settings__content">
          <>
            {smartTransactionsEnabled && (
              <Box
                marginTop={2}
                display={DISPLAY.FLEX}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Box
                  display={DISPLAY.FLEX}
                  alignItems={AlignItems.center}
                  paddingRight={3}
                >
                  <Typography
                    variant={TypographyVariant.H6}
                    boxProps={{ paddingRight: 2 }}
                  >
                    {t('smartTransaction')}
                  </Typography>
                  {currentSmartTransactionsError ? (
                    <InfoTooltip
                      position="top"
                      iconFillColor="var(--color-icon-muted)"
                      contentText={getTranslatedStxErrorMessage(
                        currentSmartTransactionsError,
                        t,
                      )}
                    />
                  ) : (
                    <InfoTooltip
                      position="top"
                      contentText={t('stxTooltip')}
                      iconFillColor="var(--color-icon-muted)"
                    />
                  )}
                </Box>
                <ToggleButton
                  value={smartTransactionsOptInStatus}
                  onToggle={(value) => {
                    setSmartTransactionsOptInStatus(!value, value);
                  }}
                  offLabel={t('off')}
                  onLabel={t('on')}
                  disabled={Boolean(currentSmartTransactionsError)}
                />
              </Box>
            )}
            {!isDirectWrappingEnabled && (
              <>
                <Box display={DISPLAY.FLEX} alignItems={AlignItems.center}>
                  <Typography
                    variant={TypographyVariant.H6}
                    boxProps={{ paddingRight: 2 }}
                  >
                    {t('swapsMaxSlippage')}
                  </Typography>
                  {currentSmartTransactionsError ? (
                    <InfoTooltip
                      position="top"
                      iconFillColor="var(--color-icon-muted)"
                      contentText={getTranslatedStxErrorMessage(
                        currentSmartTransactionsError,
                        t,
                      )}
                    />
                  ) : (
                    <InfoTooltip
                      position="top"
                      iconFillColor="var(--color-icon-muted)"
                      contentText={t('swapSlippageTooltip')}
                    />
                  )}
                </Box>
                <Box display={DISPLAY.FLEX}>
                  <ButtonGroup
                    defaultActiveButtonIndex={
                      activeButtonIndex === 2 && !customValue
                        ? 1
                        : activeButtonIndex
                    }
                    variant="radiogroup"
                    newActiveButtonIndex={activeButtonIndex}
                    className={classnames(
                      'button-group',
                      'transaction-settings__button-group',
                    )}
                  >
                    <Button
                      onClick={() => {
                        setCustomValue('');
                        setEnteringCustomValue(false);
                        setActiveButtonIndex(0);
                        onSelect(Slippage.default);
                      }}
                    >
                      {t('swapSlippagePercent', [Slippage.default])}
                    </Button>
                    <Button
                      onClick={() => {
                        setCustomValue('');
                        setEnteringCustomValue(false);
                        setActiveButtonIndex(1);
                        onSelect(Slippage.high);
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
                            data-testid="transaction-settings__custom-slippage"
                            onChange={(event) => {
                              const { value } = event.target;
                              const isValueNumeric = !isNaN(Number(value));
                              if (isValueNumeric) {
                                setCustomValue(value);
                                onSelect(Number(value));
                              }
                            }}
                            type="text"
                            maxLength="4"
                            ref={setInputRef}
                            onBlur={() => {
                              setEnteringCustomValue(false);
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
                </Box>
              </>
            )}
          </>
          {notificationText && (
            <Box marginTop={5}>
              <BannerAlert
                severity={notificationSeverity}
                title={notificationTitle}
              >
                <Typography variant={TypographyVariant.H6}>
                  {notificationText}
                </Typography>
              </BannerAlert>
            </Box>
          )}
        </div>
      </Popover>
    </div>
  );
}

TransactionSettings.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onModalClose: PropTypes.func.isRequired,
  maxAllowedSlippage: PropTypes.number.isRequired,
  currentSlippage: PropTypes.number,
  smartTransactionsEnabled: PropTypes.bool.isRequired,
  smartTransactionsOptInStatus: PropTypes.bool,
  setSmartTransactionsOptInStatus: PropTypes.func,
  currentSmartTransactionsError: PropTypes.string,
  isDirectWrappingEnabled: PropTypes.bool,
};
