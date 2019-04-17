import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import validUrl from 'valid-url'
import PageContainerFooter from '../../../../components/ui/page-container/page-container-footer'
import TextField from '../../../../components/ui/text-field'

export default class NetworksTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
  }

  state = {
    rpcUrl: this.props.rpcUrl,
    chainId: this.props.chainId,
    ticker: this.props.ticker,
    networkName: this.props.networkName,
  }

  componentDidUpdate (prevProps) {
    const { rpcUrl: prevRpcUrl } = prevProps
    const {
      rpcUrl,
      chainId,
      ticker,
      networkName,
    } = this.props

    if (prevRpcUrl !== rpcUrl) {
      this.setState({ rpcUrl, chainId, ticker, networkName })
    }
  }

  renderFormTextField (textFieldLabelKey, textFieldId, onChange, value) {
    const { viewOnly } = this.props

    return (
      <div>
        <div className="networks-tab__network-form-label">{this.context.t(textFieldLabelKey)}</div>
        <TextField
          type="text"
          id={textFieldId}
          onChange={onChange}
          fullWidth
          margin="dense"
          value={value}
          disabled={viewOnly}
        />
      </div>
    )
  }

  setStateWithValue (stateKey) {
    return (e) => this.setState({ [stateKey]: e.target.value })
  }

  validateAndSetRpc () {
    const {
      rpcUrl,
      chainId,
      ticker,
      networkName,
    } = this.state
    const { setRpcTarget, displayWarning } = this.props

    if (validUrl.isWebUri(rpcUrl)) {
      if (!!chainId && Number.isNaN(parseInt(chainId))) {
        return displayWarning(`${this.context.t('invalidInput')} chainId`)
      }

      return true
      setRpcTarget(rpcUrl, chainId, ticker, networkName)
    } else {
      const appendedRpc = `http://${rpcUrl}`

      if (validUrl.isWebUri(appendedRpc)) {
        displayWarning(this.context.t('uriErrorMsg'))
      } else {
        displayWarning(this.context.t('invalidRPC'))
      }
    }
  }

  render () {
    const { onClear } = this.props 
    const {
      networkName,
      rpcUrl,
      chainId,
      ticker,
    } = this.state


    return (
      <div className="networks-tab__network-form">
        {this.renderFormTextField(
          'networkName',
          'network-name',
          this.setStateWithValue('networkName'),
          networkName,
        )}
        {this.renderFormTextField(
          'rpcUrl',
          'rpc-url',
          this.setStateWithValue('rpcUrl'),
          rpcUrl,
        )}
        {this.renderFormTextField(
          'chainId',
          'chainId',
          this.setStateWithValue('chainId'),
          chainId,
        )}
        {this.renderFormTextField(
          'symbol',
          'network-ticker',
          this.setStateWithValue('ticker'),
          ticker,
        )}
        <PageContainerFooter
          onCancel={() => {
            onClear()
            this.setState({
              rpcUrl: '',
              chainId: '',
              ticker: '',
              networkName: '',
            })
          }}
          cancelText={'Clear'}
          hideCancel={false}
          onSubmit={() => this.validateAndSetRpc({
            networkName,
            rpcUrl,
            chainId,
            ticker,
          })}
          submitText={'Save'}
          submitButtonType={'confirm'}
          disabled={false}
        />
      </div>
    )
  }

}
