import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import { ProviderPageContainerContent, ProviderPageContainerHeader } from '.'
import { PageContainerFooter } from '../../ui/page-container'

export default class ProviderPageContainer extends PureComponent {
  static propTypes = {
    approveProviderRequestByOrigin: PropTypes.func.isRequired,
    rejectProviderRequestByOrigin: PropTypes.func.isRequired,
    origin: PropTypes.string.isRequired,
    siteImage: PropTypes.string,
    siteTitle: PropTypes.string,
    hostname: PropTypes.string,
    extensionId: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  componentDidMount () {
    window.addEventListener('beforeunload', this.onCancel)
    this.context.metricsEvent({
      eventOpts: {
        category: 'Auth',
        action: 'Connect',
        name: 'Popup Opened',
      },
    })
  }

  _removeBeforeUnload () {
    window.removeEventListener('beforeunload', this.onCancel)
  }

  componentWillUnmount () {
    this._removeBeforeUnload()
  }

  onCancel = () => {
    const { origin, rejectProviderRequestByOrigin } = this.props
    this.context.metricsEvent({
      eventOpts: {
        category: 'Auth',
        action: 'Connect',
        name: 'Canceled',
      },
    })
    this._removeBeforeUnload()
    rejectProviderRequestByOrigin(origin)
  }

  onSubmit = () => {
    const { approveProviderRequestByOrigin, origin } = this.props
    this.context.metricsEvent({
      eventOpts: {
        category: 'Auth',
        action: 'Connect',
        name: 'Confirmed',
      },
    })
    this._removeBeforeUnload()
    approveProviderRequestByOrigin(origin)
  }

  render () {
    const {origin, siteImage, siteTitle, hostname, extensionId} = this.props

    return (
      <div className="page-container provider-approval-container">
        <ProviderPageContainerHeader />
        <ProviderPageContainerContent
          origin={origin}
          siteImage={siteImage}
          siteTitle={siteTitle}
          hostname={hostname}
          extensionId={extensionId}
        />
        <PageContainerFooter
          onCancel={() => this.onCancel()}
          cancelText={this.context.t('cancel')}
          onSubmit={() => this.onSubmit()}
          submitText={this.context.t('connect')}
          submitButtonType="confirm"
        />
      </div>
    )
  }
}
