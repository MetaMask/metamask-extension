import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { debounce } from 'lodash';
import Tooltip from '../../../ui/tooltip';
import { MIN_GAS_LIMIT_DEC } from '../../../../pages/send/send.constants';

export default class AdvancedGasInputs extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    updateCustomGasPrice: PropTypes.func,
    updateCustomGasLimit: PropTypes.func,
    customGasPrice: PropTypes.number.isRequired,
    customGasLimit: PropTypes.number.isRequired,
    insufficientBalance: PropTypes.bool,
    customPriceIsSafe: PropTypes.bool,
    isSpeedUp: PropTypes.bool,
    customGasLimitMessage: PropTypes.string,
    minimumGasLimit: PropTypes.number,
    customPriceIsExcessive: PropTypes.bool,
  };

  static defaultProps = {
    minimumGasLimit: Number(MIN_GAS_LIMIT_DEC),
    customPriceIsExcessive: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      gasPrice: this.props.customGasPrice,
      gasLimit: this.props.customGasLimit,
    };
    this.changeGasPrice = debounce(this.changeGasPrice, 500);
    this.changeGasLimit = debounce(this.changeGasLimit, 500);
  }

  componentDidUpdate(prevProps) {
    const {
      customGasPrice: prevCustomGasPrice,
      customGasLimit: prevCustomGasLimit,
    } = prevProps;
    const { customGasPrice, customGasLimit } = this.props;
    const { gasPrice, gasLimit } = this.state;

    if (customGasPrice !== prevCustomGasPrice && customGasPrice !== gasPrice) {
      this.setState({ gasPrice: customGasPrice });
    }
    if (customGasLimit !== prevCustomGasLimit && customGasLimit !== gasLimit) {
      this.setState({ gasLimit: customGasLimit });
    }
  }

  onChangeGasLimit = (e) => {
    this.setState({ gasLimit: e.target.value });
    this.changeGasLimit({ target: { value: e.target.value } });
  };

  changeGasLimit = (e) => {
    this.props.updateCustomGasLimit(Number(e.target.value));
  };

  onChangeGasPrice = (e) => {
    this.setState({ gasPrice: e.target.value });
    this.changeGasPrice({ target: { value: e.target.value } });
  };

  changeGasPrice = (e) => {
    this.props.updateCustomGasPrice(Number(e.target.value));
  };

  gasPriceError({
    insufficientBalance,
    customPriceIsSafe,
    isSpeedUp,
    gasPrice,
    customPriceIsExcessive,
  }) {
    const { t } = this.context;

    if (insufficientBalance) {
      return {
        errorText: t('insufficientBalance'),
        errorType: 'error',
      };
    } else if (isSpeedUp && gasPrice === 0) {
      return {
        errorText: t('zeroGasPriceOnSpeedUpError'),
        errorType: 'error',
      };
    } else if (!customPriceIsSafe) {
      return {
        errorText: t('gasPriceExtremelyLow'),
        errorType: 'warning',
      };
    } else if (customPriceIsExcessive) {
      return {
        errorText: t('gasPriceExcessiveInput'),
        errorType: 'error',
      };
    }

    return {};
  }

  gasLimitError({ insufficientBalance, gasLimit, minimumGasLimit }) {
    const { t } = this.context;

    if (insufficientBalance) {
      return {
        errorText: t('insufficientBalance'),
        errorType: 'error',
      };
    } else if (gasLimit < minimumGasLimit) {
      return {
        errorText: t('gasLimitTooLowWithDynamicFee', [minimumGasLimit]),
        errorType: 'error',
      };
    }

    return {};
  }

  renderGasInput({
    value,
    onChange,
    errorComponent,
    errorType,
    label,
    customMessageComponent,
    tooltipTitle,
  }) {
    return (
      <div className="advanced-gas-inputs__gas-edit-row">
        <div className="advanced-gas-inputs__gas-edit-row__label">
          {label}
          <Tooltip title={tooltipTitle} position="top" arrow>
            <i className="fa fa-info-circle" />
          </Tooltip>
        </div>
        <div className="advanced-gas-inputs__gas-edit-row__input-wrapper">
          <input
            className={classnames('advanced-gas-inputs__gas-edit-row__input', {
              'advanced-gas-inputs__gas-edit-row__input--error':
                errorType === 'error',
              'advanced-gas-inputs__gas-edit-row__input--warning':
                errorType === 'warning',
            })}
            type="number"
            min="0"
            value={value}
            onChange={onChange}
          />
          <div
            className={classnames(
              'advanced-gas-inputs__gas-edit-row__input-arrows',
              {
                'advanced-gas-inputs__gas-edit-row__input--error':
                  errorType === 'error',
                'advanced-gas-inputs__gas-edit-row__input--warning':
                  errorType === 'warning',
              },
            )}
          >
            <div
              className="advanced-gas-inputs__gas-edit-row__input-arrows__i-wrap"
              onClick={() => onChange({ target: { value: value + 1 } })}
            >
              <i className="fa fa-sm fa-angle-up" />
            </div>
            <div
              className="advanced-gas-inputs__gas-edit-row__input-arrows__i-wrap"
              onClick={() =>
                onChange({ target: { value: Math.max(value - 1, 0) } })
              }
            >
              <i className="fa fa-sm fa-angle-down" />
            </div>
          </div>
          {errorComponent || customMessageComponent}
        </div>
      </div>
    );
  }

  render() {
    const {
      insufficientBalance,
      customPriceIsSafe,
      isSpeedUp,
      customGasLimitMessage,
      minimumGasLimit,
      customPriceIsExcessive,
    } = this.props;
    const { gasPrice, gasLimit } = this.state;

    const {
      errorText: gasPriceErrorText,
      errorType: gasPriceErrorType,
    } = this.gasPriceError({
      insufficientBalance,
      customPriceIsSafe,
      isSpeedUp,
      gasPrice,
      customPriceIsExcessive,
    });
    const gasPriceErrorComponent = gasPriceErrorType ? (
      <div
        className={`advanced-gas-inputs__gas-edit-row__${gasPriceErrorType}-text`}
      >
        {gasPriceErrorText}
      </div>
    ) : null;

    const {
      errorText: gasLimitErrorText,
      errorType: gasLimitErrorType,
    } = this.gasLimitError({ insufficientBalance, gasLimit, minimumGasLimit });
    const gasLimitErrorComponent = gasLimitErrorType ? (
      <div
        className={`advanced-gas-inputs__gas-edit-row__${gasLimitErrorType}-text`}
      >
        {gasLimitErrorText}
      </div>
    ) : null;

    const gasLimitCustomMessageComponent = customGasLimitMessage ? (
      <div className="advanced-gas-inputs__gas-edit-row__custom-text">
        {customGasLimitMessage}
      </div>
    ) : null;

    return (
      <div className="advanced-gas-inputs__gas-edit-rows">
        {this.renderGasInput({
          label: this.context.t('gasPrice'),
          tooltipTitle: this.context.t('gasPriceInfoTooltipContent'),
          value: this.state.gasPrice,
          onChange: this.onChangeGasPrice,
          errorComponent: gasPriceErrorComponent,
          errorType: gasPriceErrorType,
        })}
        {this.renderGasInput({
          label: this.context.t('gasLimit'),
          tooltipTitle: this.context.t('gasLimitInfoTooltipContent'),
          value: this.state.gasLimit,
          onChange: this.onChangeGasLimit,
          errorComponent: gasLimitErrorComponent,
          customMessageComponent: gasLimitCustomMessageComponent,
          errorType: gasLimitErrorType,
        })}
      </div>
    );
  }
}
