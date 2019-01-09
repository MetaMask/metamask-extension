import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { approveProviderRequest, rejectProviderRequest } from '../../ui/app/actions'
import { connect } from 'react-redux'
class ProviderApproval extends Component {
  render () {
    const { approveProviderRequest, origin, tabID, rejectProviderRequest } = this.props
    return (
      <div className="flex-column flex-grow">
        <style dangerouslySetInnerHTML={{__html: `
          .provider_approval_actions {
            display: flex;
            justify-content: flex-end;
            margin: 14px 25px;
          }
          .provider_approval_actions button {
            margin-left: 10px;
            text-transform: uppercase;
          }
          .provider_approval_content {
            padding: 0 25px;
          }
          .provider_approval_origin {
            font-weight: bold;
            margin: 14px 0;
          }
        `}} />
        <div className="section-title flex-row flex-center">
          <i
            className="fa fa-arrow-left fa-lg cursor-pointer"
            onClick={() => { rejectProviderRequest(tabID) }} />
          <h2 className="page-subtitle">Web3 API Request</h2>
        </div>
        <div className="provider_approval_content">
          {"The domain listed below is requesting access to the Ethereum blockchain and to view your current account. Always double check that you're on the correct site before approving access."}
          <div className="provider_approval_origin">{origin}</div>
        </div>
        <div className="provider_approval_actions">
          <button
            className="btn-green"
            onClick={() => { approveProviderRequest(tabID) }}>APPROVE</button>
          <button
            className="cancel btn-red"
            onClick={() => { rejectProviderRequest(tabID) }}>REJECT</button>
        </div>
      </div>
    )
  }
}

ProviderApproval.propTypes = {
  approveProviderRequest: PropTypes.func,
  origin: PropTypes.string,
  tabID: PropTypes.string,
  rejectProviderRequest: PropTypes.func,
}

function mapDispatchToProps (dispatch) {
  return {
    approveProviderRequest: tabID => dispatch(approveProviderRequest(tabID)),
    rejectProviderRequest: tabID => dispatch(rejectProviderRequest(tabID)),
  }
}

module.exports = connect(null, mapDispatchToProps)(ProviderApproval)
