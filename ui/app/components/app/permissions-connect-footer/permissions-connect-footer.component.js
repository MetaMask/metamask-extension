import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class PermissionsConnectFooter extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  render() {
    const { t } = this.context;
    return (
      <div className="permissions-connect-footer">
        <div className="permissions-connect-footer__text">
          <div>{t('onlyConnectTrust')}</div>
          <div
            className="permissions-connect-footer__text--link"
            onClick={() => {
              global.platform.openTab({
                url:
                  'https://medium.com/metamask/privacy-mode-is-now-enabled-by-default-1c1c957f4d57',
              });
            }}
          >
            {t('learnMore')}
          </div>
        </div>
      </div>
    );
  }
}
