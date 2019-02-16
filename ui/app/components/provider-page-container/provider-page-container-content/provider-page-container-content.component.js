import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import Identicon from '../../identicon'

export default class ProviderPageContainerContent extends PureComponent {
  static propTypes = {
    request: PropTypes.object.isRequired,
    selectedIdentity: PropTypes.object.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  };

  renderConnectVisual = () => {
    const { request, selectedIdentity } = this.props
    const { origin, siteImage, siteTitle } = request.metadata

    return (
      <div className="provider-approval-visual">
        <section>
          {siteImage ? (
            <img
              className="provider-approval-visual__identicon"
              src={siteImage}
            />
          ) : (
            <i className="provider-approval-visual__identicon--default">
              {siteTitle.charAt(0).toUpperCase()}
            </i>
          )}
          <h1>{siteTitle}</h1>
          <h2>{origin}</h2>
        </section>
        <span className="provider-approval-visual__check" />
        <section>
          <Identicon
            className="provider-approval-visual__identicon"
            address={selectedIdentity.address}
            diameter={64}
          />
          <h1>{selectedIdentity.name}</h1>
        </section>
      </div>
    )
  }

  render () {
    const { request } = this.props
    const { options } = request
    const optsArr = Object.keys(options)
    const { siteTitle } = request.metadata
    const { t } = this.context

    return (
      <div className="provider-approval-container__content">
        <section>
          <h2>{t('connectRequest')}</h2>
          {this.renderConnectVisual()}
          <h1>{t('providerRequest', [siteTitle])}</h1>
          <p>
            {t('providerRequestInfo')}
            <br/>

            <p>
              Also requesting: {optsArr.join('\n')}
            </p>

            <a
              href="https://medium.com/metamask/introducing-privacy-mode-42549d4870fa"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('learnMore')}.
            </a>
          </p>
        </section>
        <section className="secure-badge">
          <img src="/images/mm-secure.svg" />
        </section>
      </div>
    )
  }
}

