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
    editRpc: PropTypes.func,
    rpcUrl: PropTypes.string,
    chainId: PropTypes.string,
    ticker: PropTypes.string,
    viewOnly: PropTypes.bool,
    networkName: PropTypes.string,
    onClear: PropTypes.func,
    setRpcTarget: PropTypes.func,
    networksTabIsInAddMode: PropTypes.bool,
    blockExplorerUrl: PropTypes.string,
    rpcPrefs: PropTypes.object,
  }

  state = {
    rpcUrl: this.props.rpcUrl,
    chainId: this.props.chainId,
    ticker: this.props.ticker,
    networkName: this.props.networkName,
    blockExplorerUrl: this.props.blockExplorerUrl,
    errors: {},
  }

  componentDidUpdate (prevProps) {
    const { rpcUrl: prevRpcUrl, networksTabIsInAddMode: prevAddMode } = prevProps
    const {
      rpcUrl,
      chainId,
      ticker,
      networkName,
      networksTabIsInAddMode,
      blockExplorerUrl,
    } = this.props

    if (!prevAddMode && networksTabIsInAddMode) {
      this.setState({
        rpcUrl: '',
        chainId: '',
        ticker: '',
        networkName: '',
        blockExplorerUrl: '',
        errors: {},
      })
    } else if (prevRpcUrl !== rpcUrl) {
      this.setState({ rpcUrl, chainId, ticker, networkName, blockExplorerUrl, errors: {} })
    }
  }

  componentWillUnmount () {
    this.props.onClear()
    this.setState({
      rpcUrl: '',
      chainId: '',
      ticker: '',
      networkName: '',
      blockExplorerUrl: '',
      errors: {},
    })
  }

  renderFormTextField (fieldKey, textFieldId, onChange, value, optionalTextFieldKey) {
    const { errors } = this.state
    const { viewOnly } = this.props

    return (
      <div className="networks-tab__network-form-row">
        <div className="networks-tab__network-form-label">{this.context.t(optionalTextFieldKey || fieldKey)}</div>
        <TextField
          type="text"
          id={textFieldId}
          onChange={onChange}
          fullWidth
          margin="dense"
          value={value}
          disabled={viewOnly}
          error={errors[fieldKey]}
        />
      </div>
    )
  }

  setStateWithValue = (stateKey, validator) => {
    return (e) => {
      validator && validator(e.target.value, stateKey)
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

  validateUrl = (url, stateKey) => {
    if (validUrl.isWebUri(url)) {
      this.setErrorTo(stateKey, '')
    } else {
      const appendedRpc = `http://${url}`
      const validWhenAppended = validUrl.isWebUri(appendedRpc) && !url.match(/^https*:\/\/$/)

      this.setErrorTo(stateKey, this.context.t(validWhenAppended ? 'uriErrorMsg' : 'invalidRPC'))
    }
  }

  render () {
    const { onClear, setRpcTarget, viewOnly, rpcUrl: propsRpcUrl, editRpc, rpcPrefs = {} } = this.props
    const {
      networkName,
      rpcUrl,
      chainId,
      ticker,
      blockExplorerUrl,
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
          this.setStateWithValue('rpcUrl', this.validateUrl),
          rpcUrl,
        )}
        {this.renderFormTextField(
          'chainId',
          'chainId',
          this.setStateWithValue('chainId', this.validateChainId),
          chainId,
          'optionalChainId',
        )}
        {this.renderFormTextField(
          'symbol',
          'network-ticker',
          this.setStateWithValue('ticker'),
          ticker,
          'optionalSymbol',
        )}
        {this.renderFormTextField(
          'blockExplorerUrl',
          'block-explorer-url',
          this.setStateWithValue('blockExplorerUrl', this.validateUrl),
          blockExplorerUrl,
          'optionalBlockExplorerUrl',
        )}
        <PageContainerFooter
          onCancel={() => {
            onClear()
            this.setState({
              rpcUrl: '',
              chainId: '',
              ticker: '',
              networkName: '',
              blockExplorerUrl: '',
              errors: {},
            })
          }}
          cancelText={this.context.t('cancel')}
          hideCancel={false}
          onSubmit={() => {
            if (rpcUrl !== propsRpcUrl) {
              editRpc(propsRpcUrl, rpcUrl, chainId, ticker, networkName, blockExplorerUrl || rpcPrefs.blockExplorerUrl)
            } else {
              setRpcTarget(rpcUrl, chainId, ticker, networkName, {
                blockExplorerUrl: blockExplorerUrl || rpcPrefs.blockExplorerUrl,
                ...rpcPrefs,
              })
            }
          }}
          submitText={this.context.t('save')}
          submitButtonType={'confirm'}
          disabled={viewOnly || Object.values(errors).some(x => x) || !rpcUrl}
        />
      </div>
    )
  }

}
