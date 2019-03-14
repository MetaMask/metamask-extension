import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ProviderPageContainer from '../../components/provider-page-container'

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
    return (
      <ProviderPageContainer
        approveProviderRequest={approveProviderRequest}
        origin={providerRequest.origin}
        tabID={providerRequest.tabID}
        rejectProviderRequest={rejectProviderRequest}
        siteImage={providerRequest.siteImage}
        siteTitle={providerRequest.siteTitle}
      />
    )
  }
}
