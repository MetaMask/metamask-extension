import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import { ProviderPageContainerContent, ProviderPageContainerHeader } from './'
import { PageContainerFooter } from '../page-container'

export default class ProviderPageContainer extends PureComponent {
  static propTypes = {
    approveProviderRequest: PropTypes.func.isRequired,
    rejectProviderRequest: PropTypes.func.isRequired,
    request: PropTypes.object.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  onCancel = () => {
    const { request, rejectProviderRequest } = this.props
    const { id } = request.metadata
    rejectProviderRequest(id)
  }

  onSubmit = () => {
    const { request, approveProviderRequest } = this.props
    const { id } = request.metadata
    approveProviderRequest(id)
  }

  render () {
    const { request } = this.props
    const {origin, siteImage, siteTitle} = request.metadata

    return (
      <div className="page-container provider-approval-container">
        <ProviderPageContainerHeader />
        <ProviderPageContainerContent
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
