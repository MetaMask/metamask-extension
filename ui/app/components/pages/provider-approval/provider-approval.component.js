import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ProviderPageContainer from '../../provider-page-container'

export default class ProviderApproval extends Component {
  static propTypes = {
    approveProviderRequest: PropTypes.func.isRequired,
    providerRequest: PropTypes.object.isRequired,
    rejectProviderRequest: PropTypes.func.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render () {
    const { approveProviderRequest, providerRequest, rejectProviderRequest } = this.props
    console.log('rendering page container with ', approveProviderRequest)
    return (
      <ProviderPageContainer
        approveProviderRequest={approveProviderRequest}
        rejectProviderRequest={rejectProviderRequest}
        request={providerRequest}
     />
    )
  }
}
