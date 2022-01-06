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
                  'https://metamask.zendesk.com/hc/en-us/articles/4405506066331-User-guide-Dapps',
              });
            }}
          >
            {t('learnMoreUpperCase')}
          </div>
        </div>
      </div>
    );
  }
}
