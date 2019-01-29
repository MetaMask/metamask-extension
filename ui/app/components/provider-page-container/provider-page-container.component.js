import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import { ProviderPageContainerContent, ProviderPageContainerHeader } from './'
import { PageContainerFooter } from '../page-container'

export default class ProviderPageContainer extends PureComponent {
  static propTypes = {
    approveProviderRequest: PropTypes.func.isRequired,
    origin: PropTypes.string.isRequired,
    rejectProviderRequest: PropTypes.func.isRequired,
    siteImage: PropTypes.string,
    siteTitle: PropTypes.string.isRequired,
    tabID: PropTypes.string.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  componentDidMount () {
    this.context.metricsEvent({
      eventOpts: {
        category: 'Activation/Retention',
        action: 'dappRequestsAccess',
        name: 'connectPopupOpened',
      },
    })
  }

  onCancel = () => {
    const { tabID, rejectProviderRequest } = this.props
    this.context.metricsEvent({
      eventOpts: {
        category: 'Activation/Retention',
        action: 'userClicksCancel',
        name: 'connectCanceled',
      },
    })
    rejectProviderRequest(tabID)
  }

  onSubmit = () => {
    const { approveProviderRequest, tabID } = this.props
    this.context.metricsEvent({
      eventOpts: {
        category: 'Activation/Retention',
        action: 'userClicksConfirm',
        name: 'connectConfirmed',
      },
    })
    approveProviderRequest(tabID)
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
