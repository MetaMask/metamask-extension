import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ProviderPageContainer from '../../components/app/provider-page-container'

export default class ProviderApproval extends Component {
  static propTypes = {
    approveProviderRequestByOrigin: PropTypes.func.isRequired,
    rejectProviderRequestByOrigin: PropTypes.func.isRequired,
    providerRequest: PropTypes.object.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render () {
    const { approveProviderRequestByOrigin, providerRequest, rejectProviderRequestByOrigin } = this.props
    return (
      <ProviderPageContainer
        approveProviderRequestByOrigin={approveProviderRequestByOrigin}
        rejectProviderRequestByOrigin={rejectProviderRequestByOrigin}
        origin={providerRequest.origin}
        tabID={providerRequest.tabID}
        siteImage={providerRequest.siteImage}
        siteTitle={providerRequest.siteTitle}
      />
    )
  }
}
