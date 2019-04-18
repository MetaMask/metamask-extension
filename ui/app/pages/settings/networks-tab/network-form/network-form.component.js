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
    rpcUrl: PropTypes.string,
    chainId: PropTypes.string,
    ticker: PropTypes.string,
    viewOnly: PropTypes.bool,
    networkName: PropTypes.string,
    onClear: PropTypes.func,
    setRpcTarget: PropTypes.func,
  }

  state = {
    rpcUrl: this.props.rpcUrl,
    chainId: this.props.chainId,
    ticker: this.props.ticker,
    networkName: this.props.networkName,
    errors: {},
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
    const { errors } = this.state
    const { viewOnly } = this.props

    return (
      <div className="networks-tab__network-form-row">
        <div className="networks-tab__network-form-label">{this.context.t(textFieldLabelKey)}</div>
        <TextField
          type="text"
          id={textFieldId}
          onChange={onChange}
          fullWidth
          margin="dense"
          value={value}
          disabled={viewOnly}
          error={errors[textFieldLabelKey]}
        />
      </div>
    )
  }

  setStateWithValue = (stateKey, validator) => {
    return (e) => {
      validator && validator(e.target.value)
      this.setState({ [stateKey]: e.target.value })
    }
  }

  setErrorTo = (errorKey, errorVal) => {
    this.setState({
      errors: {
        ...this.state.errors,
        [errorKey]: errorVal,
      },
    })
  }

  validateChainId = (chainId) => {
    this.setErrorTo('chainId', !!chainId && Number.isNaN(parseInt(chainId))
      ? `${this.context.t('invalidInput')} chainId`
      : ''
    )
  }

  validateRpcUrl = (rpcUrl) => {
    if (validUrl.isWebUri(rpcUrl)) {
      this.setErrorTo('rpcUrl', '')
    } else {
      const appendedRpc = `http://${rpcUrl}`
      const validWhenAppended = validUrl.isWebUri(appendedRpc) && !rpcUrl.match(/^https*:\/\/$/)

      this.setErrorTo('rpcUrl', this.context.t(validWhenAppended ? 'uriErrorMsg' : 'invalidRPC'))
    }
  }

  render () {
    const { onClear, setRpcTarget, viewOnly } = this.props
    const {
      networkName,
      rpcUrl,
      chainId,
      ticker,
      errors,
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
          this.setStateWithValue('rpcUrl', this.validateRpcUrl),
          rpcUrl,
        )}
        {this.renderFormTextField(
          'chainId',
          'chainId',
          this.setStateWithValue('chainId', this.validateChainId),
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
              errors: {},
            })
          }}
          cancelText={this.context.t('cancel')}
          hideCancel={false}
          onSubmit={() => setRpcTarget(rpcUrl, chainId, ticker, networkName)}
          submitText={this.context.t('save')}
          submitButtonType={'confirm'}
          disabled={viewOnly || Object.values(errors).some(x => x) || !rpcUrl}
        />
      </div>
    )
  }

}
