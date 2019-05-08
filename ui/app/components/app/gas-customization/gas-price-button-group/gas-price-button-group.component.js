import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ButtonGroup from '../../../ui/button-group'
import Button from '../../../ui/button'

const GAS_OBJECT_PROPTYPES_SHAPE = {
  label: PropTypes.string,
  feeInPrimaryCurrency: PropTypes.string,
  feeInSecondaryCurrency: PropTypes.string,
  timeEstimate: PropTypes.string,
  priceInHexWei: PropTypes.string,
}

export default class GasPriceButtonGroup extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    buttonDataLoading: PropTypes.bool,
    className: PropTypes.string,
    defaultActiveButtonIndex: PropTypes.number,
    gasButtonInfo: PropTypes.arrayOf(PropTypes.shape(GAS_OBJECT_PROPTYPES_SHAPE)),
    handleGasPriceSelection: PropTypes.func,
    newActiveButtonIndex: PropTypes.number,
    noButtonActiveByDefault: PropTypes.bool,
    showCheck: PropTypes.bool,
  }

  renderButtonContent ({
    labelKey,
    feeInPrimaryCurrency,
    feeInSecondaryCurrency,
    timeEstimate,
  }, {
    className,
    showCheck,
  }) {
    return (<div>
      { labelKey && <div className={`${className}__label`}>{ this.context.t(labelKey) }</div> }
      { timeEstimate && <div className={`${className}__time-estimate`}>{ timeEstimate }</div> }
      { feeInPrimaryCurrency && <div className={`${className}__primary-currency`}>{ feeInPrimaryCurrency }</div> }
      { feeInSecondaryCurrency && <div className={`${className}__secondary-currency`}>{ feeInSecondaryCurrency }</div> }
      { showCheck && <div className="button-check-wrapper"><i className="fa fa-check fa-sm" /></div> }
    </div>)
  }

  renderButton ({
    priceInHexWei,
    ...renderableGasInfo
  }, {
    buttonDataLoading: _,
    handleGasPriceSelection,
    ...buttonContentPropsAndFlags
  }, index) {
    return (
      <Button
        onClick={() => handleGasPriceSelection(priceInHexWei)}
        key={`gas-price-button-${index}`}
      >
        {this.renderButtonContent(renderableGasInfo, buttonContentPropsAndFlags)}
      </Button>
    )
  }

  render () {
    const {
      gasButtonInfo,
      defaultActiveButtonIndex = 1,
      newActiveButtonIndex,
      noButtonActiveByDefault = false,
      buttonDataLoading,
      ...buttonPropsAndFlags
    } = this.props

    return (
      !buttonDataLoading
        ? <ButtonGroup
          className={buttonPropsAndFlags.className}
          defaultActiveButtonIndex={defaultActiveButtonIndex}
          newActiveButtonIndex={newActiveButtonIndex}
          noButtonActiveByDefault={noButtonActiveByDefault}
        >
          { gasButtonInfo.map((obj, index) => this.renderButton(obj, buttonPropsAndFlags, index)) }
        </ButtonGroup>
        : <div className={`${buttonPropsAndFlags.className}__loading-container`}>{ this.context.t('loading') }</div>
    )
  }
}
