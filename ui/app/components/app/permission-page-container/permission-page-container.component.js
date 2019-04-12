import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import { PermissionPageContainerContent, PermissionPageContainerHeader } from '.'
import { PageContainerFooter } from '../../ui/page-container'

export default class PermissionPageContainer extends PureComponent {
  static propTypes = {
    approvePermissionRequest: PropTypes.func.isRequired,
    rejectPermissionRequest: PropTypes.func.isRequired,
    request: PropTypes.object.isRequired,
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
    const { request, rejectPermissionRequest } = this.props
    const { id } = request.metadata
    rejectPermissionRequest(id)
  }

  onSubmit = () => {
    const { request, approvePermissionRequest } = this.props
    const { id } = request.metadata
    approvePermissionRequest(id)
  }

  render () {
    const { request } = this.props
    const { origin, siteImage, siteTitle } = request

    return (
      <div className="page-container permission-approval-container">
        <PermissionPageContainerHeader />
        <PermissionPageContainerContent
          request={request}
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
