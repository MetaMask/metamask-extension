import React, { useState, useEffect, useContext } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { useFocus } from '../../../hooks/useFocus'
import { I18nContext } from '../../../contexts/i18n'
import ButtonGroup from '../../../components/ui/button-group'
import Button from '../../../components/ui/button'
import InfoTooltip from '../../../components/ui/info-tooltip'

export default function SlippageButtons ({
  onSelect,
}) {
  const t = useContext(I18nContext)
  const [open, setOpen] = useState(false)
  const [customValue, setCustomValue] = useState(null)
  const [enteringCustomValue, setEnteringCustomValue] = useState(false)
  const [inputRef, setInputFocus] = useFocus()
  const [inputRefSet, setInputRefSet] = useState(false)

  const errorText = customValue !== null && Number(customValue) < 0.5
    ? t('swapLowSlippageError')
    : ''
  const customValueText = customValue === null ? t('swapCustom') : customValue

  useEffect(() => {
    if (inputRef?.current && !inputRefSet) {
      setInputRefSet(true)
      setInputFocus(inputRef)
    }
  }, [inputRef, inputRefSet, setInputFocus])

  return (
    <div className="slippage-buttons">
      <div
        onClick={() => setOpen(!open)}
        className={classnames('slippage-buttons__header', {
          'slippage-buttons__header--open': open,
        })}
      >
        <div className="slippage-buttons__header-text">{t('swapsAdvancedOptions')}</div>
        {open ? <i className="fa fa-angle-up" /> : <i className="fa fa-angle-down" />}
      </div>
      {open && (
        <div className="slippage-buttons__dropdown-content">
          <div className="slippage-buttons__buttons-prefix">
            <div className="slippage-buttons__prefix-text">{t('swapsMaxSlippage')}</div>
            <InfoTooltip
              position="top"
              contentText={t('swapAdvancedSlippageInfo')}
            />
          </div>
          <ButtonGroup
            className="radio-button-group"
            activeClass="radio-button-group radio-button--active"
            defaultActiveButtonIndex={1}
          >
            <Button
              className="radio-button-group radio-button"
              onClick={() => {
                setCustomValue(null)
                setEnteringCustomValue(false)
                onSelect(1)
              }}
            >
              1%
            </Button>
            <Button
              className="radio-button-group radio-button"
              onClick={() => {
                setCustomValue(null)
                setEnteringCustomValue(false)
                onSelect(2)
              }}
            >
              2%
            </Button>
            <Button
              className={classnames('radio-button-group radio-button', 'slippage-buttons__custom-button', {
                'radio-button--danger': errorText,
              })}
              onClick={() => setEnteringCustomValue(true)}
            >
              {(enteringCustomValue
                ? (
                  <div
                    className={classnames('slippage-buttons__custom-input', {
                      'slippage-buttons__custom-input--danger': errorText,
                    })}
                  >
                    <input
                      onChange={(event) => {
                        setCustomValue(event.target.value)
                        onSelect(event.target.value)
                      }}
                      type="number"
                      placeholder="0"
                      ref={inputRef}
                    />
                  </div>
                )
                : customValueText
              )}
            </Button>
          </ButtonGroup>
        </div>
      )}
      {errorText && (
        <div className="slippage-buttons__error-text">
          { errorText }
        </div>
      )}
    </div>
  )
}

SlippageButtons.propTypes = {
  onSelect: PropTypes.func.isRequired,
}
