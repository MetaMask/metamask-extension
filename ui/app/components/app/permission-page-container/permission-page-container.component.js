import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { PermissionPageContainerContent, PermissionPageContainerHeader } from '.'
import { PageContainerFooter } from '../../ui/page-container'

export default class PermissionPageContainer extends Component {

  static propTypes = {
    approvePermissionsRequest: PropTypes.func.isRequired,
    rejectPermissionsRequest: PropTypes.func.isRequired,
    selectedIdentity: PropTypes.object.isRequired,
    permissionsDescriptions: PropTypes.array.isRequired,
    requests: PropTypes.array.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  constructor (props) {
    super(props)
    this.state = {
      selectedAccount: props.selectedIdentity,
    }
  }

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
    const { requests, rejectPermissionsRequest } = this.props
    const id = requests[0].metadata.id
    rejectPermissionsRequest(id)
  }

  onSubmit = () => {

    // sanity validation
    if (!this.state.selectedAccount) {
      throw new Error(
        'Fatal: no account selected'
      )
    }

    const { requests, approvePermissionsRequest } = this.props

    if ('eth_accounts' in requests[0].permissions) {
      requests[0].permissions.eth_accounts = {
        caveats: [
          { type: 'filterResponse', value: [this.state.selectedAccount.address] },
        ],
      }
    }
    approvePermissionsRequest(requests[0])
  }

  onAccountSelect = selectedAccount => {
    this.setState({ selectedAccount })
  }

  render () {
    const { requests, permissionsDescriptions } = this.props

    return (
      <div className="page-container permission-approval-container">
        <PermissionPageContainerHeader />
        <PermissionPageContainerContent
          requests={requests}
          onAccountSelect={this.onAccountSelect}
          selectedAccount={this.state.selectedAccount}
          permissionsDescriptions={permissionsDescriptions}
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
