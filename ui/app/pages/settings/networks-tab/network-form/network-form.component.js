import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import validUrl from 'valid-url'
import TextField from '../../../../components/ui/text-field'
import Button from '../../../../components/ui/button'

export default class NetworkForm extends PureComponent {
  static contextTypes = {
    t: PropTypes.func.isRequired,
    metricsEvent: PropTypes.func.isRequired,
  }

  static propTypes = {
    editRpc: PropTypes.func.isRequired,
    showConfirmDeleteNetworkModal: PropTypes.func.isRequired,
    rpcUrl: PropTypes.string,
    chainId: PropTypes.string,
    ticker: PropTypes.string,
    viewOnly: PropTypes.bool,
    networkName: PropTypes.string,
    onClear: PropTypes.func.isRequired,
    setRpcTarget: PropTypes.func.isRequired,
    networksTabIsInAddMode: PropTypes.bool,
    isCurrentRpcTarget: PropTypes.bool,
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

  resetForm () {
    const {
      rpcUrl,
      chainId,
      ticker,
      networkName,
      blockExplorerUrl,
    } = this.props

    this.setState({ rpcUrl, chainId, ticker, networkName, blockExplorerUrl, errors: {} })
  }

  onSubmit = () => {
    const {
      setRpcTarget,
      rpcUrl: propsRpcUrl,
      editRpc,
      rpcPrefs = {},
      onClear,
      networksTabIsInAddMode,
    } = this.props
    const {
      networkName,
      rpcUrl,
      chainId,
      ticker,
      blockExplorerUrl,
    } = this.state
    if (propsRpcUrl && rpcUrl !== propsRpcUrl) {
      editRpc(propsRpcUrl, rpcUrl, chainId, ticker, networkName, {
        blockExplorerUrl: blockExplorerUrl || rpcPrefs.blockExplorerUrl,
        ...rpcPrefs,
      })
    } else {
      setRpcTarget(rpcUrl, chainId, ticker, networkName, {
        blockExplorerUrl: blockExplorerUrl || rpcPrefs.blockExplorerUrl,
        ...rpcPrefs,
      })
    }

    if (networksTabIsInAddMode) {
      onClear()
    }
  }

  onCancel = () => {
    const {
      networksTabIsInAddMode,
      onClear,
    } = this.props

    if (networksTabIsInAddMode) {
      onClear()
    } else {
      this.resetForm()
    }
  }

  onDelete = () => {
    const { showConfirmDeleteNetworkModal, rpcUrl, onClear } = this.props
    showConfirmDeleteNetworkModal({
      target: rpcUrl,
      onConfirm: () => {
        this.resetForm()
        onClear()
      },
    })
  }

  stateIsUnchanged () {
    const {
      rpcUrl,
      chainId,
      ticker,
      networkName,
      blockExplorerUrl,
    } = this.props

    const {
      rpcUrl: stateRpcUrl,
      chainId: stateChainId,
      ticker: stateTicker,
      networkName: stateNetworkName,
      blockExplorerUrl: stateBlockExplorerUrl,
    } = this.state

    return (
      stateRpcUrl === rpcUrl &&
      stateChainId === chainId &&
      stateTicker === ticker &&
      stateNetworkName === networkName &&
      stateBlockExplorerUrl === blockExplorerUrl
    )
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
    const invalidUrlErrorMsg = stateKey === 'rpcUrl' ? 'invalidRPC' : 'invalidBlockExplorerURL'

    if (validUrl.isWebUri(url) || (stateKey === 'blockExplorerUrl' && url === '')) {
      this.setErrorTo(stateKey, '')
    } else {
      const appendedRpc = `http://${url}`
      const validWhenAppended = validUrl.isWebUri(appendedRpc) && !url.match(/^https?:\/\/$/)

      this.setErrorTo(stateKey, this.context.t(validWhenAppended ? 'uriErrorMsg' : invalidUrlErrorMsg))
    }
  }

  render () {
    const { t } = this.context
    const {
      viewOnly,
      isCurrentRpcTarget,
      networksTabIsInAddMode,
    } = this.props
    const {
      networkName,
      rpcUrl,
      chainId = '',
      ticker,
      blockExplorerUrl,
      errors,
    } = this.state

    const isSubmitDisabled = viewOnly || this.stateIsUnchanged() || Object.values(errors).some(x => x) || !rpcUrl
    const deletable = !networksTabIsInAddMode && !isCurrentRpcTarget && !viewOnly

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
        <div className="network-form__footer">
          {
            deletable && (
              <Button
                type="danger"
                onClick={this.onDelete}
              >
                { t('delete') }
              </Button>
            )
          }
          <Button
            type="default"
            onClick={this.onCancel}
            disabled={viewOnly || this.stateIsUnchanged()}
          >
            { t('cancel') }
          </Button>
          <Button
            type="secondary"
            disabled={isSubmitDisabled}
            onClick={this.onSubmit}
          >
            { t('save') }
          </Button>
        </div>
      </div>
    )
  }

}
