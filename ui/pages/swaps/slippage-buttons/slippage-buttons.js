import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { I18nContext } from '../../../contexts/i18n';
import ButtonGroup from '../../../components/ui/button-group';
import Button from '../../../components/ui/button';
import InfoTooltip from '../../../components/ui/info-tooltip';
import ToggleButton from '../../../components/ui/toggle-button';
import Box from '../../../components/ui/box';
import {
  TextVariant,
  FontWeight,
  AlignItems,
  Display,
} from '../../../helpers/constants/design-system';
import { getTranslatedStxErrorMessage } from '../swaps.util';
import {
  Slippage,
  SMART_SWAPS_FAQ_AND_RISK_DISCLOSURES_URL,
} from '../../../../shared/constants/swaps';
import {
  Text,
  ButtonLink,
  ButtonLinkSize,
} from '../../../components/component-library';

export default function SlippageButtons({
  onSelect,
  maxAllowedSlippage,
  currentSlippage,
  smartTransactionsEnabled,
  smartTransactionsOptInStatus,
  setSmartTransactionsOptInStatus,
  currentSmartTransactionsError,
  isDirectWrappingEnabled,
}) {
  const t = useContext(I18nContext);
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
  const [open, setOpen] = useState(() => {
    return currentSlippage !== Slippage.default; // Only open Advanced options by default if it's not default slippage.
  });
  const [inputRef, setInputRef] = useState(null);

  let errorText = '';
  if (customValue) {
    // customValue is a string, e.g. '0'
    if (Number(customValue) < 0) {
      errorText = t('swapSlippageNegative');
    } else if (Number(customValue) > 0 && Number(customValue) <= 1) {
      // We will not show this warning for 0% slippage, because we will only
      // return non-slippage quotes from off-chain makers.
      errorText = t('swapLowSlippageError');
    } else if (
      Number(customValue) >= 5 &&
      Number(customValue) <= maxAllowedSlippage
    ) {
      errorText = t('swapHighSlippageWarning');
    } else if (Number(customValue) > maxAllowedSlippage) {
      errorText = t('swapsExcessiveSlippageWarning');
    }
  }

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

  return (
    <div className="slippage-buttons">
      <button
        onClick={() => setOpen(!open)}
        className={classnames('slippage-buttons__header', {
          'slippage-buttons__header--open': open,
        })}
      >
        <div className="slippage-buttons__header-text">
          {t('swapsAdvancedOptions')}
        </div>
        {open ? (
          <i className="fa fa-angle-up" />
        ) : (
          <i className="fa fa-angle-down" />
        )}
      </button>
      <div className="slippage-buttons__content">
        {open && (
          <>
            {!isDirectWrappingEnabled && (
              <div className="slippage-buttons__dropdown-content">
                <div className="slippage-buttons__buttons-prefix">
                  <div className="slippage-buttons__prefix-text">
                    {t('swapsMaxSlippage')}
                  </div>
                  <InfoTooltip
                    position="top"
                    contentText={t('swapSlippageTooltip')}
                  />
                </div>
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
                    'slippage-buttons__button-group',
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
                      'slippage-buttons__button-group-custom-button',
                      {
                        'radio-button--danger': errorText,
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
                          'slippage-buttons__custom-input',
                          {
                            'slippage-buttons__custom-input--danger': errorText,
                          },
                        )}
                      >
                        <input
                          data-testid="slippage-buttons__custom-slippage"
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
                      <div className="slippage-buttons__percentage-suffix">
                        %
                      </div>
                    )}
                  </Button>
                </ButtonGroup>
              </div>
            )}
            {smartTransactionsEnabled && (
              <Box marginTop={2} display={Display.Flex}>
                <Box
                  display={Display.Flex}
                  alignItems={AlignItems.center}
                  paddingRight={3}
                >
                  <Text
                    variant={TextVariant.bodySm}
                    as="h6"
                    paddingRight={2}
                    fontWeight={FontWeight.Bold}
                  >
                    {t('smartSwaps')}
                  </Text>
                  {currentSmartTransactionsError ? (
                    <InfoTooltip
                      position="top"
                      contentText={getTranslatedStxErrorMessage(
                        currentSmartTransactionsError,
                        t,
                      )}
                    />
                  ) : (
                    <InfoTooltip
                      position="top"
                      contentText={t('smartSwapsTooltip', [
                        <ButtonLink
                          key="smart-swaps-faq-and-risk-disclosures"
                          size={ButtonLinkSize.Inherit}
                          href={SMART_SWAPS_FAQ_AND_RISK_DISCLOSURES_URL}
                          externalLink
                          display={Display.Inline}
                        >
                          {t('faqAndRiskDisclosures')}
                        </ButtonLink>,
                      ])}
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
          </>
        )}
        {errorText && (
          <div className="slippage-buttons__error-text">{errorText}</div>
        )}
      </div>
    </div>
  );
}

SlippageButtons.propTypes = {
  onSelect: PropTypes.func.isRequired,
  maxAllowedSlippage: PropTypes.number.isRequired,
  currentSlippage: PropTypes.number,
  smartTransactionsEnabled: PropTypes.bool.isRequired,
  smartTransactionsOptInStatus: PropTypes.bool,
  setSmartTransactionsOptInStatus: PropTypes.func,
  currentSmartTransactionsError: PropTypes.string,
  isDirectWrappingEnabled: PropTypes.bool,
};
