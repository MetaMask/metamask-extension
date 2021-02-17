import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Dropdown from '../../../components/ui/dropdown';

// Subviews
import JsonImportView from './json';
import PrivateKeyImportView from './private-key';

export default class AccountImportSubview extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  state = {};

  getMenuItemTexts() {
    return [this.context.t('privateKey'), this.context.t('jsonFile')];
  }

  renderImportView() {
    const { type } = this.state;
    const menuItems = this.getMenuItemTexts();
    const current = type || menuItems[0];

    switch (current) {
      case this.context.t('privateKey'):
        return <PrivateKeyImportView />;
      case this.context.t('jsonFile'):
        return <JsonImportView />;
      default:
        return <JsonImportView />;
    }
  }

  render() {
    const menuItems = this.getMenuItemTexts();
    const { type } = this.state;

    return (
      <div className="new-account-import-form">
        <div className="new-account-import-disclaimer">
          <span>{this.context.t('importAccountMsg')}</span>
          <span
            style={{
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
            onClick={() => {
              global.platform.openTab({
                url:
                  'https://metamask.zendesk.com/hc/en-us/articles/360015289932',
              });
            }}
          >
            {this.context.t('here')}
          </span>
        </div>
        <div className="new-account-import-form__select-section">
          <div className="new-account-import-form__select-label">
            {this.context.t('selectType')}
          </div>
          <Dropdown
            className="new-account-import-form__select"
            options={menuItems.map((text) => ({ value: text }))}
            selectedOption={type || menuItems[0]}
            onChange={(value) => {
              this.setState({ type: value });
            }}
          />
        </div>
        {this.renderImportView()}
      </div>
    );
  }
}
