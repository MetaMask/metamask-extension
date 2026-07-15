import React, { Component } from 'react';
import classnames from 'clsx';
import PropTypes from 'prop-types';
import { Box, BoxAlignItems } from '@metamask/design-system-react';
import { Color, TextVariant } from '../../../helpers/constants/design-system';
import { getAccountNameErrorMessage } from '../../../helpers/utils/accounts';
import { ButtonIcon, IconName, Text } from '../../component-library';
import { FormTextField } from '../../component-library/form-text-field/deprecated';
import { I18nContext } from '../../../contexts/i18n';

export default class EditableLabel extends Component {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    defaultValue: PropTypes.string,
    className: PropTypes.string,
    accounts: PropTypes.array,
  };

  static contextType = I18nContext;

  state = {
    isEditing: false,
    value: this.props.defaultValue || '',
  };

  async handleSubmit(isValidAccountName) {
    if (!isValidAccountName) {
      return;
    }

    await this.props.onSubmit(this.state.value.trim());
    this.setState({ isEditing: false });
  }

  renderEditing() {
    const { isValidAccountName, errorMessage } = getAccountNameErrorMessage(
      this.props.accounts,
      { t: this.context },
      this.state.value,
      this.props.defaultValue,
    );

    return (
      <Box
        className={classnames('flex editable-label', this.props.className)}
        gap={3}
      >
        <FormTextField
          required
          value={this.state.value}
          onKeyPress={(event) => {
            if (event.key === 'Enter') {
              this.handleSubmit(isValidAccountName);
            }
          }}
          onChange={(event) => {
            this.setState({ value: event.target.value });
          }}
          data-testid="editable-input"
          error={!isValidAccountName}
          helpText={errorMessage}
          autoFocus
          placeholder={this.context('accountName')}
        />
        <ButtonIcon
          iconName={IconName.Check}
          onClick={() => this.handleSubmit(isValidAccountName)}
          data-testid="save-account-label-input"
        />
      </Box>
    );
  }

  renderReadonly() {
    return (
      <Box className="flex" alignItems={BoxAlignItems.Center} gap={3}>
        <Text
          variant={TextVariant.bodyLgMedium}
          style={{ wordBreak: 'break-word' }}
        >
          {this.state.value}
        </Text>
        <ButtonIcon
          iconName={IconName.Edit}
          ariaLabel={this.context('edit')}
          data-testid="editable-label-button"
          onClick={() => this.setState({ isEditing: true })}
          color={Color.iconDefault}
        />
      </Box>
    );
  }

  render() {
    return this.state.isEditing ? this.renderEditing() : this.renderReadonly();
  }
}
