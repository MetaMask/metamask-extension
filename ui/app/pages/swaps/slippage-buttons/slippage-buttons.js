import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { I18nContext } from '../../../contexts/i18n';
import ButtonGroup from '../../../components/ui/button-group';
import Button from '../../../components/ui/button';
import InfoTooltip from '../../../components/ui/info-tooltip';

export default function SlippageButtons({
  onSelect,
  maxAllowedSlippage,
  currentSlippage,
}) {
  const t = useContext(I18nContext);
  const [customValue, setCustomValue] = useState(() => {
    if (currentSlippage && currentSlippage !== 2 && currentSlippage !== 3) {
      return currentSlippage;
    }
    return '';
  });
  const [enteringCustomValue, setEnteringCustomValue] = useState(false);
  const [activeButtonIndex, setActiveButtonIndex] = useState(() => {
    if (currentSlippage === 3) {
      return 1;
    } else if (currentSlippage === 2) {
      return 0;
    } else if (currentSlippage) {
      return 2;
    }
    return 1; // Choose activeButtonIndex = 1 for 3% slippage by default.
  });
  const [inputRef, setInputRef] = useState(null);

  let errorText = '';
  if (customValue) {
    if (Number(customValue) <= 0) {
      errorText = t('swapSlippageTooLow');
    } else if (Number(customValue) < 0.5) {
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
      <div className="slippage-buttons__header">
        <div className="slippage-buttons__header-text">
          {t('swapsAdvancedOptions')}
        </div>
      </div>
      <div className="slippage-buttons__content">
        <div className="slippage-buttons__dropdown-content">
          <div className="slippage-buttons__buttons-prefix">
            <div className="slippage-buttons__prefix-text">
              {t('swapsMaxSlippage')}
            </div>
            <InfoTooltip
              position="top"
              contentText={t('swapAdvancedSlippageInfo')}
            />
          </div>
          <ButtonGroup
            defaultActiveButtonIndex={
              activeButtonIndex === 2 && !customValue ? 1 : activeButtonIndex
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
                onSelect(2);
              }}
            >
              2%
            </Button>
            <Button
              onClick={() => {
                setCustomValue('');
                setEnteringCustomValue(false);
                setActiveButtonIndex(1);
                onSelect(3);
              }}
            >
              3%
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
                  className={classnames('slippage-buttons__custom-input', {
                    'slippage-buttons__custom-input--danger': errorText,
                  })}
                >
                  <input
                    onChange={(event) => {
                      setCustomValue(event.target.value);
                      onSelect(Number(event.target.value));
                    }}
                    type="number"
                    step="0.1"
                    ref={setInputRef}
                    onBlur={() => {
                      setEnteringCustomValue(false);
                      if (customValue === '0') {
                        setCustomValue('');
                        setActiveButtonIndex(1);
                      }
                    }}
                    value={customValue || ''}
                  />
                </div>
              ) : (
                customValueText
              )}
              {(customValue || enteringCustomValue) && (
                <div className="slippage-buttons__percentage-suffix">%</div>
              )}
            </Button>
          </ButtonGroup>
        </div>
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
};
