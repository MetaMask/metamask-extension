import PageContainerContent from '../../page-container'
import PropTypes from 'prop-types'
import React, { Component } from 'react'

export default class ProviderApproval extends Component {
  static propTypes = {
    approveProviderRequest: PropTypes.func,
    origin: PropTypes.string,
    rejectProviderRequest: PropTypes.func,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render () {
    const { approveProviderRequest, origin, rejectProviderRequest } = this.props
    return (
      <PageContainerContent
        title={this.context.t('providerAPIRequest')}
        subtitle={this.context.t('reviewProviderRequest')}
        contentComponent={(
          <div className="provider_approval_content">
            {this.context.t('providerRequestInfo')}
            <div className="provider_approval_origin">{origin}</div>
          </div>
        )}
        submitText={this.context.t('approve')}
        cancelText={this.context.t('reject')}
        onSubmit={() => { approveProviderRequest(origin) }}
        onCancel={() => { rejectProviderRequest(origin) }}
        onClose={() => { rejectProviderRequest(origin) }} />
    )
  }
}
