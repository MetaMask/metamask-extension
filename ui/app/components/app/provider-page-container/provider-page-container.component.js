import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import { ProviderPageContainerContent, ProviderPageContainerHeader } from '.'
import { PageContainerFooter } from '../../ui/page-container'
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../../app/scripts/lib/enums'
import { getEnvironmentType } from '../../../../../app/scripts/lib/util'

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
    if (getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_NOTIFICATION) {
      window.addEventListener('beforeunload', this._beforeUnload)
    }
    this.context.metricsEvent({
      eventOpts: {
        category: 'Auth',
        action: 'Connect',
        name: 'Popup Opened',
      },
    })
  }

  _beforeUnload = () => {
    const { origin, rejectProviderRequestByOrigin } = this.props
    this.context.metricsEvent({
      eventOpts: {
        category: 'Auth',
        action: 'Connect',
        name: 'Cancel Connect Request Via Notification Close',
      },
    })
    this._removeBeforeUnload()
    rejectProviderRequestByOrigin(origin)
  }

  _removeBeforeUnload () {
    window.removeEventListener('beforeunload', this._beforeUnload)
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
