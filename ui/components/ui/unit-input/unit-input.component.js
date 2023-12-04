import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

function removeLeadingZeroes(str) {
  return str.replace(/^0*(?=\d)/u, '');
}

/**
 * Component that attaches a suffix or unit of measurement trailing user input, ex. 'ETH'. Also
 * allows rendering a child component underneath the input to, for example, display conversions of
 * the shown suffix.
 */
export default class UnitInput extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    dataTestId: PropTypes.string,
    children: PropTypes.node,
    actionComponent: PropTypes.node,
    error: PropTypes.bool,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    placeholder: PropTypes.string,
    suffix: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };

  static defaultProps = {
    value: '',
    placeholder: '0',
  };

  state = {
    value: this.props.value,
  };

  componentDidUpdate(prevProps) {
    const { value: prevPropsValue } = prevProps;
    const { value: propsValue } = this.props;
    const { value: stateValue } = this.state;

    if (
      prevPropsValue !== propsValue &&
      Number(propsValue) !== Number(stateValue)
    ) {
      this.setState({ value: propsValue });
    }
  }

  handleFocus = () => {
    this.unitInput.focus();
  };

  handleInputFocus = ({ target: { value } }) => {
    if (value === '0') {
      this.setState({ value: '' });
    }
  };

  handleInputBlur = ({ target: { value } }) => {
    if (value === '') {
      this.setState({ value: '0' });
    }

    this.props.onBlur && this.props.onBlur(value);
  };

  handleChange = (event) => {
    const { value: userInput } = event.target;
    let value = userInput;

    if (userInput.length && userInput.length > 1) {
      value = removeLeadingZeroes(userInput);
    }

    this.setState({ value });
    this.props.onChange(value);
  };

  getInputWidth(value) {
    const valueString = String(value);
    const valueLength = valueString.length || 1;
    const decimalPointDeficit = valueString.match(/\./u) ? -0.5 : 0;
    return `${valueLength + decimalPointDeficit + 0.5}ch`;
  }

  render() {
    const {
      className,
      error,
      placeholder,
      suffix,
      actionComponent,
      children,
      dataTestId,
    } = this.props;
    const { value } = this.state;

    return (
      <div
        className={classnames(
          'unit-input',
          { 'unit-input--error': error },
          className,
        )}
        onClick={this.handleFocus}
      >
        <div className="unit-input__inputs">
          <div className="unit-input__input-container">
            <input
              data-testid={dataTestId}
              type="number"
              dir="ltr"
              className={classnames('unit-input__input')}
              value={value}
              placeholder={placeholder}
              onChange={this.handleChange}
              onBlur={this.handleInputBlur}
              onFocus={this.handleInputFocus}
              style={{ width: this.getInputWidth(value) }}
              ref={(ref) => {
                this.unitInput = ref;
              }}
              autoFocus
            />
            {suffix ? <div className="unit-input__suffix">{suffix}</div> : null}
          </div>
          {children}
        </div>
        {actionComponent}
      </div>
    );
  }
}
