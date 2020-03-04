import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import validUrl from 'valid-url'
import TextField from '../../../../components/ui/text-field'
import Button from '../../../../components/ui/button'
import ToggleButton from '../../../../components/ui/toggle-button'

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
    rpcUrls: PropTypes.array,
  }

  state = {
    rpcUrl: this.props.rpcUrl,
    chainId: this.props.chainId,
    ticker: this.props.ticker,
    networkName: this.props.networkName,
    blockExplorerUrl: this.props.blockExplorerUrl,
    errors: {},
    rpcPrefs: {
      gasPriceSource: (this.props.rpcPrefs && this.props.rpcPrefs.gasPriceSource),
    },
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
      rpcPrefs,
    } = this.props

    if (!prevAddMode && networksTabIsInAddMode) {
      this.setState({
        rpcUrl: '',
        chainId: '',
        ticker: '',
        networkName: '',
        blockExplorerUrl: '',
        errors: {},
        rpcPrefs: {
          ...rpcPrefs,
        },
      })
    } else if (prevRpcUrl !== rpcUrl) {
      const gasPriceSource = (rpcPrefs && rpcPrefs.gasPriceSource) || false
      this.setState({ rpcUrl, chainId, ticker, networkName, blockExplorerUrl, errors: {}, rpcPrefs: { gasPriceSource } })
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
      rpcPrefs: {
        gasPriceSource: false,
      },
    })
  }

  resetForm () {
    const {
      rpcUrl,
      chainId,
      ticker,
      networkName,
      blockExplorerUrl,
      rpcPrefs = {
        gasPriceSource: false,
      },
    } = this.props

    this.setState({ rpcUrl, chainId, ticker, networkName, blockExplorerUrl, errors: {}, rpcPrefs })
  }

  onSubmit = () => {
    const {
      setRpcTarget,
      rpcUrl: propsRpcUrl,
      editRpc,
      rpcPrefs,
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

    const gasPriceSource = this.state.rpcPrefs.gasPriceSource

    if (propsRpcUrl && rpcUrl !== propsRpcUrl) {
      editRpc(propsRpcUrl, rpcUrl, chainId, ticker, networkName, {
        blockExplorerUrl: blockExplorerUrl || rpcPrefs.blockExplorerUrl,
        ...rpcPrefs,
        gasPriceSource,
      })
    } else {
      setRpcTarget(rpcUrl, chainId, ticker, networkName, {
        blockExplorerUrl: blockExplorerUrl || rpcPrefs.blockExplorerUrl,
        ...rpcPrefs,
        gasPriceSource,
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
      rpcPrefs,
    } = this.props
    const {
      rpcUrl: stateRpcUrl,
      chainId: stateChainId,
      ticker: stateTicker,
      networkName: stateNetworkName,
      blockExplorerUrl: stateBlockExplorerUrl,
      rpcPrefs: {
        gasPriceSource: stateGasPriceSource,
      },
    } = this.state

    return (
      stateRpcUrl === rpcUrl &&
      stateChainId === chainId &&
      stateTicker === ticker &&
      stateNetworkName === networkName &&
      stateBlockExplorerUrl === blockExplorerUrl &&
      stateGasPriceSource === ((rpcPrefs && rpcPrefs.gasPriceSource) || false)
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

  renderToogleButton (fieldKey, onChange, value) {
    const { t } = this.context

    return (
      <div className="gasSource">
        <ToggleButton
          id={fieldKey}
          value={value}
          onToggle={onChange}
          offLabel={t('off')}
          onLabel={t('on')}
        />
        <span>{t(fieldKey)}</span>
      </div>
    )
  }

  setStateWithValue = (stateKey) => {
    return (e) => {
      const value = e.hasOwnProperty('target') ? e.target.value : !e // if is toogle button invert old state
      if (stateKey === 'gasPriceSource') {
        this.setState({ rpcPrefs: { ...this.state.rpcPrefs, [stateKey]: value } })
      } else {
        this.setState({ [stateKey]: value })
      }
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

  isValidWhenAppended = (url) => {
    const appendedRpc = `http://${url}`
    return validUrl.isWebUri(appendedRpc) && !url.match(/^https?:\/\/$/)
  }

  validateBlockExplorerURL = (url, stateKey) => {
    if (!validUrl.isWebUri(url) && url !== '') {
      this.setErrorTo(stateKey, this.context.t(this.isValidWhenAppended(url) ? 'urlErrorMsg' : 'invalidBlockExplorerURL'))
    } else {
      this.setErrorTo(stateKey, '')
    }
  }

  validateUrlRpcUrl = (url, stateKey) => {
    const { rpcUrls } = this.props

    if (!validUrl.isWebUri(url) && url !== '') {
      this.setErrorTo(stateKey, this.context.t(this.isValidWhenAppended(url) ? 'urlErrorMsg' : 'invalidRPC'))
    } else if (rpcUrls.includes(url)) {
      this.setErrorTo(stateKey, this.context.t('urlExistsErrorMsg'))
    } else {
      this.setErrorTo(stateKey, '')
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
      rpcPrefs,
    } = this.state

    const isSubmitDisabled = viewOnly || this.stateIsUnchanged() || Object.values(errors).some((x) => x) || !rpcUrl
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
          this.setStateWithValue('rpcUrl', this.validateUrlRpcUrl),
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
          this.setStateWithValue('blockExplorerUrl', this.validateBlockExplorerURL),
          blockExplorerUrl,
          'optionalBlockExplorerUrl',
        )}
        {
          this.renderToogleButton(
            'gasPriceSource',
            this.setStateWithValue('gasPriceSource'),
            rpcPrefs.gasPriceSource
          )
        }

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
