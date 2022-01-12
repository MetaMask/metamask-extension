import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

class EditableLabel extends Component {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    defaultValue: PropTypes.string,
    className: PropTypes.string,
    accountsNames: PropTypes.array,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    isEditing: false,
    value: this.props.defaultValue || '',
  };

  handleSubmit() {
    const { value } = this.state;
    const { accountsNames } = this.props;

    if (value === '' || accountsNames.includes(value)) {
      return;
    }

    Promise.resolve(this.props.onSubmit(value)).then(() =>
      this.setState({ isEditing: false }),
    );
  }

  renderEditing() {
    const { value } = this.state;
    const { accountsNames } = this.props;

    return [
      <input
        key={1}
        type="text"
        required
        dir="auto"
        value={this.state.value}
        onKeyPress={(event) => {
          if (event.key === 'Enter') {
            this.handleSubmit();
          }
        }}
        onChange={(event) => this.setState({ value: event.target.value })}
        className={classnames('large-input', 'editable-label__input', {
          'editable-label__input--error':
            value === '' || accountsNames.includes(value),
        })}
        autoFocus
      />,
      <button
        className="editable-label__icon-button"
        key={2}
        onClick={() => this.handleSubmit()}
      >
        <i className="fa fa-check editable-label__icon" />
      </button>,
    ];
  }

  renderReadonly() {
    return [
      <div key={1} className="editable-label__value">
        {this.state.value}
      </div>,
      <button
        key={2}
        className="editable-label__icon-button"
        onClick={() => this.setState({ isEditing: true })}
      >
        <i className="fas fa-pencil-alt editable-label__icon" />
      </button>,
    ];
  }

  render() {
    const { isEditing, value } = this.state;
    const { className, accountsNames } = this.props;

    return (
      <>
        <div className={classnames('editable-label', className)}>
          {isEditing ? this.renderEditing() : this.renderReadonly()}
        </div>
        {accountsNames.includes(value) ? (
          <div
            className={classnames(
              'editable-label__error',
              'editable-label__error-amount',
            )}
          >
            {this.context.t('accountNameDuplicate')}
          </div>
        ) : null}
      </>
    );
  }
}

export default EditableLabel;
