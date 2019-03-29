import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

export default class InfoTab extends PureComponent {
  state = {
    version: global.platform.getVersion(),
  }

  static propTypes = {
    tab: PropTypes.string,
    metamask: PropTypes.object,
    setCurrentCurrency: PropTypes.func,
    setRpcTarget: PropTypes.func,
    displayWarning: PropTypes.func,
    revealSeedConfirmation: PropTypes.func,
    warning: PropTypes.string,
    location: PropTypes.object,
    history: PropTypes.object,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  renderInfoLinks () {
    const { t } = this.context

    return (
      <div className="settings-page__content-item settings-page__content-item--without-height">
        <div className="info-tab__link-header">
          { t('links') }
        </div>
        <div className="info-tab__link-item">
          <a
            href="https://metamask.io/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="info-tab__link-text">
              { t('privacyMsg') }
            </span>
          </a>
        </div>
        <div className="info-tab__link-item">
          <a
            href="https://metamask.io/terms.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="info-tab__link-text">
              { t('terms') }
            </span>
          </a>
        </div>
        <div className="info-tab__link-item">
          <a
            href="https://metamask.io/attributions.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="info-tab__link-text">
              { t('attributions') }
            </span>
          </a>
        </div>
        <hr className="info-tab__separator" />
        <div className="info-tab__link-item">
          <a
            href="https://support.metamask.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="info-tab__link-text">
              { t('supportCenter') }
            </span>
          </a>
        </div>
        <div className="info-tab__link-item">
          <a
            href="https://metamask.io/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="info-tab__link-text">
              { t('visitWebSite') }
            </span>
          </a>
        </div>
        <div className="info-tab__link-item">
          <a
            href="mailto:help@metamask.io?subject=Feedback"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="info-tab__link-text">
              { t('emailUs') }
            </span>
          </a>
        </div>
      </div>
    )
  }

  renderContent () {
    const { t } = this.context

    return (
      <div className="settings-page__body">
        <div className="settings-page__content-row">
          <div className="settings-page__content-item settings-page__content-item--without-height">
            <div className="info-tab__logo-wrapper">
              <img
                src="images/info-logo.png"
                className="info-tab__logo"
              />
            </div>
            <div className="info-tab__item">
              <div className="info-tab__version-header">
                { t('metamaskVersion') }
              </div>
              <div className="info-tab__version-number">
                { this.state.version }
              </div>
            </div>
            <div className="info-tab__item">
              <div className="info-tab__about">
                { t('builtInCalifornia') }
              </div>
            </div>
          </div>
          { this.renderInfoLinks() }
        </div>
      </div>
    )
  }

  render () {
    return this.renderContent()
  }
}
