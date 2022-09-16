import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';

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
                url: ZENDESK_URLS.USER_GUIDE_DAPPS,
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
