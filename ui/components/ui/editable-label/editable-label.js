import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Color } from '../../../helpers/constants/design-system';
import { getAccountNameErrorMessage } from '../../../helpers/utils/accounts';
import { ButtonIcon, IconName } from '../../component-library';

export default class EditableLabel extends Component {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    defaultValue: PropTypes.string,
    className: PropTypes.string,
    accounts: PropTypes.array,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    isEditing: false,
    value: this.props.defaultValue || '',
  };

  async handleSubmit(isValidAccountName) {
    if (!isValidAccountName) {
      return;
    }

    await this.props.onSubmit(this.state.value);
    this.setState({ isEditing: false });
  }

  renderEditing() {
    const { isValidAccountName, errorMessage } = getAccountNameErrorMessage(
      this.props.accounts,
      this.context,
      this.state.value,
      this.props.defaultValue,
    );

    return (
      <div className={classnames('editable-label', this.props.className)}>
        <input
          type="text"
          required
          dir="auto"
          value={this.state.value}
          onKeyPress={(event) => {
            if (event.key === 'Enter') {
              this.handleSubmit(isValidAccountName);
            }
          }}
          onChange={(event) => this.setState({ value: event.target.value })}
          data-testid="editable-input"
          className={classnames('large-input', 'editable-label__input', {
            'editable-label__input--error': !isValidAccountName,
          })}
          autoFocus
        />
        <ButtonIcon
          iconName={IconName.Check}
          className="editable-label__icon-button"
          onClick={() => this.handleSubmit(isValidAccountName)}
        />
        <div className="editable-label__error editable-label__error-amount">
          {errorMessage}
        </div>
      </div>
    );
  }

  renderReadonly() {
    return (
      <div className={classnames('editable-label', this.props.className)}>
        <div className="editable-label__value">{this.state.value}</div>
        <ButtonIcon
          iconName={IconName.Edit}
          ariaLabel={this.context.t('edit')}
          data-testid="editable-label-button"
          onClick={() => this.setState({ isEditing: true })}
          color={Color.iconDefault}
        />
      </div>
    );
  }

  render() {
    return this.state.isEditing ? this.renderEditing() : this.renderReadonly();
  }
}
