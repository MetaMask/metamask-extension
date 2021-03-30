import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Captcha from '../../components/ui/captcha';

const siteKey = process.env.HCAPTCHA_SITE_KEY;

export default class CaptchaComponent extends Component {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  };

  static propTypes = {
    history: PropTypes.object.isRequired,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    sendCaptchaToken: PropTypes.func.isRequired,
    currentLocale: PropTypes.string.isRequired,
  };

  renderHeader = () => {
    return (
      <div className="captcha__header">
        <div className="captcha__header__text">
          {this.context.t('requestCaptchaToken')}
        </div>
      </div>
    );
  };

  onToken = (token) => {
    const { history, mostRecentOverviewPage, sendCaptchaToken } = this.props;
    sendCaptchaToken(token);
    history.push(mostRecentOverviewPage);
  };

  renderBody = () => {
    return (
      <div>
        <form>
          <div className="captcha__body">
            <div className="captcha__visual">
              <section>
                <div className="captcha__notice">
                  <Captcha
                    sitekey={siteKey}
                    onVerify={this.onToken}
                    lang={this.props.currentLocale}
                  />
                </div>
              </section>
            </div>
          </div>
        </form>
      </div>
    );
  };

  render() {
    return (
      <div>
        {this.renderHeader()}
        {this.renderBody()}
      </div>
    );
  }
}
