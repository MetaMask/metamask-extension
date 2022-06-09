import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../components/ui/button';
import IconTokenSearch from '../../../../components/ui/icon/icon-token-search';

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
          href="https://metamask.zendesk.com/hc/en-us/articles/360015489031"
          target="_blank"
          rel="noopener noreferrer"
        >
          {this.context.t('learnMoreUpperCase')}
        </Button>
      </div>
    );
  }
}
