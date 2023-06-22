import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import { SUPPORT_REQUEST_LINK } from '../../helpers/constants/common';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';

class ErrorPage extends PureComponent {
  static contextTypes = {
    t: PropTypes.func.isRequired,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    error: PropTypes.object.isRequired,
  };

  renderErrorDetail(content) {
    return (
      <li>
        <p>{content}</p>
      </li>
    );
  }

  renderErrorStack(title, stack) {
    return (
      <li>
        <span>{title}</span>
        <pre className="error-page__stack">{stack}</pre>
      </li>
    );
  }

  render() {
    const { error } = this.props;
    const { t } = this.context;

    const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
    const supportLink = (
      <a
        target="_blank"
        key="metamaskSupportLink"
        rel="noopener noreferrer"
        href={SUPPORT_REQUEST_LINK}
        onClick={() => {
          this.context.trackEvent(
            {
              category: MetaMetricsEventCategory.Error,
              event: MetaMetricsEventName.SupportLinkClicked,
              properties: {
                url: SUPPORT_REQUEST_LINK,
              },
            },
            {
              contextPropsIntoEventProperties: [
                MetaMetricsContextProp.PageTitle,
              ],
            },
          );
        }}
      >
        <span className="error-page__link-text">{this.context.t('here')}</span>
      </a>
    );
    const message = isPopup
      ? t('errorPagePopupMessage', [supportLink])
      : t('errorPageMessage', [supportLink]);

    return (
      <section className="error-page">
        <h1 className="error-page__header">{t('errorPageTitle')}</h1>
        <h2 className="error-page__subheader">{message}</h2>
        <section className="error-page__details">
          <details>
            <summary>{t('errorDetails')}</summary>
            <ul>
              {error.message
                ? this.renderErrorDetail(t('errorMessage', [error.message]))
                : null}
              {error.code
                ? this.renderErrorDetail(t('errorCode', [error.code]))
                : null}
              {error.name
                ? this.renderErrorDetail(t('errorName', [error.name]))
                : null}
              {error.stack
                ? this.renderErrorStack(t('errorStack'), error.stack)
                : null}
            </ul>
          </details>
        </section>
      </section>
    );
  }
}

export default ErrorPage;
