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

  renderRequestedPermissions = () => {
    const { request, permissionsDescriptions } = this.props
    const { options } = request
    const { t } = this.context
    const optsArr = Object.keys(options)

    const items = optsArr.map((funcName) => {
      const matchingFuncs = permissionsDescriptions.filter(perm => perm.method === funcName)
      const match = matchingFuncs[0]
      if (!match) {
        throw new Error('Requested unknown permission.')
      }
      return (
        <li
          className="permission-requested"
          key={funcName}
          >
          {match.description}
        </li>
      )
    })

    return (
      <ul className="permissions-requested">
        <h4>{t('permissionsRequest')}</h4>
        {items}
      </ul>
    )
  }

  render () {
    const { request } = this.props
    const { siteTitle } = request.metadata
    const { t } = this.context

    return (
      <div className="provider-approval-container__content">
        <section>
          <h2>{t('connectRequest')}</h2>
          {this.renderConnectVisual()}
          <h1>{t('providerRequest', [siteTitle])}</h1>
          <p>
            <br/>
            {this.renderRequestedPermissions()}
            <br/>
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

