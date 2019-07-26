import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import ProviderPageContainer from '../../components/app/provider-page-container'
import { DEFAULT_ROUTE } from '../../helpers/constants/routes'

export default class ProviderApproval extends Component {
  static propTypes = {
    approveProviderRequestByOrigin: PropTypes.func.isRequired,
    rejectProviderRequestByOrigin: PropTypes.func.isRequired,
    providerRequest: PropTypes.object,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render () {
    const { approveProviderRequestByOrigin, providerRequest, rejectProviderRequestByOrigin } = this.props

    if (!providerRequest) {
      return <Redirect to={{ pathname: DEFAULT_ROUTE }} />
    }

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
