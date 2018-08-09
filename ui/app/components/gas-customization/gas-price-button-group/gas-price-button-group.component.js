import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ButtonGroup from '../../button-group'
import Button from '../../button'

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
    noButtonActiveByDefault: PropTypes.bool,
    showCheck: PropTypes.bool,
  }

  renderButtonContent ({
    label,
    feeInPrimaryCurrency,
    feeInSecondaryCurrency,
    timeEstimate,
  }, {
    className,
    showCheck,
  }) {
    return (<div>
      { label && <div className={`${className}__label`}>{ label }</div> }
      { feeInPrimaryCurrency && <div className={`${className}__primary-currency`}>{ feeInPrimaryCurrency }</div> }
      { feeInSecondaryCurrency && <div className={`${className}__secondary-currency`}>{ feeInSecondaryCurrency }</div> }
      { timeEstimate && <div className={`${className}__time-estimate`}>{ timeEstimate }</div> }
      { showCheck && <i className="fa fa-check fa-2x" /> }
    </div>)
  }

  renderButton ({
    priceInHexWei,
    ...renderableGasInfo
  }, {
    buttonDataLoading,
    handleGasPriceSelection,
    ...buttonContentPropsAndFlags
  }, index) {
    return (
      <Button
        onClick={() => handleGasPriceSelection(priceInHexWei)}
        key={`gas-price-button-${index}`}
      >
        {buttonDataLoading
          ? 'Loading...'
          : this.renderButtonContent(renderableGasInfo, buttonContentPropsAndFlags)}
      </Button>
    )
  }

  render () {
    const {
      gasButtonInfo,
      defaultActiveButtonIndex = 1,
      noButtonActiveByDefault = false,
      ...buttonPropsAndFlags
    } = this.props

    return (
      <ButtonGroup
        className={buttonPropsAndFlags.className}
        defaultActiveButtonIndex={defaultActiveButtonIndex}
        noButtonActiveByDefault={noButtonActiveByDefault}
      >
        { gasButtonInfo.map((obj, index) => this.renderButton(obj, buttonPropsAndFlags, index)) }
      </ButtonGroup>
    )
  }
}
