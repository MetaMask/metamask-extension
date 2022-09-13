import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../components/ui/button';
import IconTokenSearch from '../../../../components/ui/icon/icon-token-search';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';

export default class TokenListPlaceholder extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  render() {
    return (
      <div className="token-list-placeholder">
        <IconTokenSearch size={64} color="var(--color-icon-muted)" />
        <div className="token-list-placeholder__text">
          {this.context.t('addAcquiredTokens')}
        </div>
        <Button
          type="link"
          className="token-list-placeholder__link"
          href={ZENDESK_URLS.ADD_CUSTOM_TOKENS}
          target="_blank"
          rel="noopener noreferrer"
        >
          {this.context.t('learnMoreUpperCase')}
        </Button>
      </div>
    );
  }
}
