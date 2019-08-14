import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import ConnectedSiteEntry from './connected-site-row'
import TextField from '../../../components/ui/text-field'
import Button from '../../../components/ui/button'

export default class ConnectionsTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static defaultProps = {
    activeTab: {},
  }

  static propTypes = {
    activeTab: PropTypes.object,
    approvedOrigins: PropTypes.object.isRequired,
    approveProviderRequestByOrigin: PropTypes.func.isRequired,
    rejectProviderRequestByOrigin: PropTypes.func.isRequired,
    showClearApprovalModal: PropTypes.func.isRequired,
  }

  state = {
    input: this.props.activeTab.origin || '',
  }

  handleAddOrigin = () => {
    const newOrigin = this.state.input
    this.setState({
      input: '',
    }, () => {
      if (newOrigin && newOrigin.trim()) {
        this.props.approveProviderRequestByOrigin(newOrigin)
      }
    })
  }

  renderNewOriginInput () {
    const { t } = this.context

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('addSite') }</span>
          <div className="settings-page__content-description">
            { t('addSiteDescription') }
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <TextField
              type="text"
              value={this.state.input}
              onChange={e => this.setState({ input: e.target.value })}
              fullWidth
              margin="dense"
              min={0}
            />
            <button
              className="button btn-primary settings-tab__rpc-save-button"
              onClick={this.handleAddOrigin}
            >
              { t('connect') }
            </button>
          </div>
        </div>
      </div>
    )
  }

  renderApprovedOriginsList () {
    const { t } = this.context
    const { approvedOrigins, rejectProviderRequestByOrigin, showClearApprovalModal } = this.props
    const approvedEntries = Object.entries(approvedOrigins)
    const approvalListEmpty = approvedEntries.length === 0

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('connected') }</span>
          <span className="settings-page__content-description">
            { t('connectedDescription') }
          </span>
        </div>
        <div className="settings-page__content-item">
          {
            approvalListEmpty
              ? <div><i className="fa fa-ban" /></div>
              : null
          }
          {
            approvedEntries.map(([origin, { siteTitle, siteImage }]) => (
              <ConnectedSiteEntry
                key={origin}
                origin={origin}
                siteTitle={siteTitle}
                siteImage={siteImage}
                onDelete={() => {
                  rejectProviderRequestByOrigin(origin)
                }}
              />
            ))
          }
        </div>
        <div className="settings-page__content-item-col">
          <Button
            disabled={approvalListEmpty}
            type="warning"
            large
            className="settings-tab__button--orange"
            onClick={event => {
              event.preventDefault()
              showClearApprovalModal()
            }}
          >
            { t('clearApprovalData') }
          </Button>
        </div>
      </div>
    )
  }

  render () {
    return (
      <div className="settings-page__body">
        { this.renderNewOriginInput() }
        { this.renderApprovedOriginsList() }
      </div>
    )
  }
}
