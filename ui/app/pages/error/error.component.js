import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../app/scripts/lib/enums'

class ErrorPage extends PureComponent {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  }

  static propTypes = {
    error: PropTypes.object.isRequired,
  }

  renderErrorDetail(content) {
    return (
      <li>
        <p>{content}</p>
      </li>
    )
  }

  renderErrorStack(title, stack) {
    return (
      <li>
        <span>{title}</span>
        <pre className="error-page__stack">{stack}</pre>
      </li>
    )
  }

  render() {
    const { error } = this.props
    const { t } = this.context

    const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP

    return (
      <section className="error-page">
        <h1 className="error-page__header">{t('errorPageTitle')}</h1>
        <h2 className="error-page__subheader">
          {isPopup ? t('errorPagePopupMessage') : t('errorPageMessage')}
        </h2>
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
    )
  }
}

export default ErrorPage
