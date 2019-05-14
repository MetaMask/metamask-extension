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
    siteTitle: PropTypes.string.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  componentDidMount () {
    this.context.metricsEvent({
      eventOpts: {
        category: 'Auth',
        action: 'Connect',
        name: 'Popup Opened',
      },
    })
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
    approveProviderRequestByOrigin(origin)
  }

  render () {
    const {origin, siteImage, siteTitle} = this.props

    return (
      <div className="page-container provider-approval-container">
        <ProviderPageContainerHeader />
        <ProviderPageContainerContent
          origin={origin}
          siteImage={siteImage}
          siteTitle={siteTitle}
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
