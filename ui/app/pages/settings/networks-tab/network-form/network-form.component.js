import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import validUrl from 'valid-url'
import BigNumber from 'bignumber.js'
import log from 'loglevel'
import TextField from '../../../../components/ui/text-field'
import Button from '../../../../components/ui/button'
import Tooltip from '../../../../components/ui/tooltip'
import { isPrefixedFormattedHexString } from '../../../../../../app/scripts/lib/util'
import { jsonRpcRequest } from '../../../../helpers/utils/util'

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
    isFullScreen: PropTypes.bool,
  }

  state = {
    rpcUrl: this.props.rpcUrl,
    chainId: this.getDisplayChainIdFromProps(),
    ticker: this.props.ticker,
    networkName: this.props.networkName,
    blockExplorerUrl: this.props.blockExplorerUrl,
    errors: {},
  }

  componentDidUpdate(prevProps) {
    const {
      rpcUrl: prevRpcUrl,
      networksTabIsInAddMode: prevAddMode,
    } = prevProps
    const {
      rpcUrl,
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
      this.setState({
        rpcUrl,
        chainId: this.getDisplayChainIdFromProps(),
        ticker,
        networkName,
        blockExplorerUrl,
        errors: {},
      })
    }
  }

  componentWillUnmount() {
    this.setState({
      rpcUrl: '',
      chainId: '',
      ticker: '',
      networkName: '',
      blockExplorerUrl: '',
      errors: {},
    })

    // onClear will push the network settings route unless was pass false.
    // Since we call onClear to cause this component to be unmounted, the
    // route will already have been updated, and we avoid setting it twice.
    this.props.onClear(false)
  }

  resetForm() {
    const { rpcUrl, ticker, networkName, blockExplorerUrl } = this.props

    this.setState({
      rpcUrl,
      chainId: this.getDisplayChainIdFromProps(),
      ticker,
      networkName,
      blockExplorerUrl,
      errors: {},
    })
  }

  /**
   * Ensures that the chainId is always displayed in decimal, even though
   * it's stored in hexadecimal.
   *
   * Should be called to get the chainId whenever props are used to set the
   * component's state.
   *
   * @returns {string} The props chainId in decimal.
   */
  getDisplayChainIdFromProps() {
    const { chainId: propsChainId } = this.props

    if (
      !propsChainId ||
      typeof propsChainId !== 'string' ||
      !propsChainId.startsWith('0x')
    ) {
      return propsChainId
    }
    return new BigNumber(propsChainId, 16).toString(10)
  }

  onSubmit = async () => {
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
      chainId: stateChainId,
      ticker,
      blockExplorerUrl,
    } = this.state

    const formChainId = stateChainId.trim().toLowerCase()
    // Ensure chainId is a 0x-prefixed, lowercase hex string
    let chainId = formChainId
    if (!chainId.startsWith('0x')) {
      chainId = `0x${new BigNumber(chainId, 10).toString(16)}`
    }

    if (!(await this.validateChainIdOnSubmit(formChainId, chainId, rpcUrl))) {
      return
    }

    if (propsRpcUrl && rpcUrl !== propsRpcUrl) {
      await editRpc(propsRpcUrl, rpcUrl, chainId, ticker, networkName, {
        blockExplorerUrl: blockExplorerUrl || rpcPrefs.blockExplorerUrl,
        ...rpcPrefs,
      })
    } else {
      await setRpcTarget(rpcUrl, chainId, ticker, networkName, {
        blockExplorerUrl: blockExplorerUrl || rpcPrefs.blockExplorerUrl,
        ...rpcPrefs,
      })
    }

    if (networksTabIsInAddMode) {
      onClear()
    } else {
      this.setState({
        chainId: this.getDisplayChainIdFromProps(),
      })
    }
  }

  onCancel = () => {
    const { isFullScreen, networksTabIsInAddMode, onClear } = this.props

    if (networksTabIsInAddMode || !isFullScreen) {
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

  stateIsUnchanged() {
    const { rpcUrl, ticker, networkName, blockExplorerUrl } = this.props

    const {
      rpcUrl: stateRpcUrl,
      chainId: stateChainId,
      ticker: stateTicker,
      networkName: stateNetworkName,
      blockExplorerUrl: stateBlockExplorerUrl,
    } = this.state

    return (
      stateRpcUrl === rpcUrl &&
      stateChainId === this.getDisplayChainIdFromProps() &&
      stateTicker === ticker &&
      stateNetworkName === networkName &&
      stateBlockExplorerUrl === blockExplorerUrl
    )
  }

  renderFormTextField(
    fieldKey,
    textFieldId,
    onChange,
    value,
    optionalTextFieldKey,
    tooltipText,
  ) {
    const { errors } = this.state
    const { viewOnly } = this.props

    return (
      <div className="networks-tab__network-form-row">
        <div className="networks-tab__network-form-label">
          <div className="networks-tab__network-form-label-text">
            {this.context.t(optionalTextFieldKey || fieldKey)}
          </div>
          {!viewOnly && tooltipText ? (
            <Tooltip
              position="top"
              title={tooltipText}
              wrapperClassName="networks-tab__network-form-label-tooltip"
            >
              <i className="fa fa-info-circle" />
            </Tooltip>
          ) : null}
        </div>
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

  validateChainIdOnChange = (chainIdArg = '') => {
    const chainId = chainIdArg.trim()
    let errorMessage = ''

    if (chainId.startsWith('0x')) {
      if (!/^0x[0-9a-f]+$/iu.test(chainId)) {
        errorMessage = this.context.t('invalidHexNumber')
      } else if (!isPrefixedFormattedHexString(chainId)) {
        errorMessage = this.context.t('invalidHexNumberLeadingZeros')
      }
    } else if (!/^[0-9]+$/u.test(chainId)) {
      errorMessage = this.context.t('invalidNumber')
    } else if (chainId.startsWith('0')) {
      errorMessage = this.context.t('invalidNumberLeadingZeros')
    }

    this.setErrorTo('chainId', errorMessage)
  }

  /**
   * Validates the chain ID by checking it against the `eth_chainId` return
   * value from the given RPC URL.
   * Assumes that all strings are non-empty and correctly formatted.
   *
   * @param {string} formChainId - Non-empty, hex or decimal number string from
   * the form.
   * @param {string} parsedChainId - The parsed, hex string chain ID.
   * @param {string} rpcUrl - The RPC URL from the form.
   */
  validateChainIdOnSubmit = async (formChainId, parsedChainId, rpcUrl) => {
    const { t } = this.context
    let errorMessage
    let endpointChainId
    let providerError

    try {
      endpointChainId = await jsonRpcRequest(rpcUrl, 'eth_chainId')
    } catch (err) {
      log.warn('Failed to fetch the chainId from the endpoint.', err)
      providerError = err
    }

    if (providerError || typeof endpointChainId !== 'string') {
      errorMessage = t('failedToFetchChainId')
    } else if (parsedChainId !== endpointChainId) {
      // Here, we are in an error state. The endpoint should always return a
      // hexadecimal string. If the user entered a decimal string, we attempt
      // to convert the endpoint's return value to decimal before rendering it
      // in an error message in the form.
      if (!formChainId.startsWith('0x')) {
        try {
          endpointChainId = new BigNumber(endpointChainId, 16).toString(10)
        } catch (err) {
          log.warn(
            'Failed to convert endpoint chain ID to decimal',
            endpointChainId,
          )
        }
      }

      errorMessage = t('endpointReturnedDifferentChainId', [
        endpointChainId.length <= 12
          ? endpointChainId
          : `${endpointChainId.slice(0, 9)}...`,
      ])
    }

    if (errorMessage) {
      this.setErrorTo('chainId', errorMessage)
      return false
    }
    return true
  }

  isValidWhenAppended = (url) => {
    const appendedRpc = `http://${url}`
    return validUrl.isWebUri(appendedRpc) && !url.match(/^https?:\/\/$/u)
  }

  validateBlockExplorerURL = (url, stateKey) => {
    if (!validUrl.isWebUri(url) && url !== '') {
      this.setErrorTo(
        stateKey,
        this.context.t(
          this.isValidWhenAppended(url)
            ? 'urlErrorMsg'
            : 'invalidBlockExplorerURL',
        ),
      )
    } else {
      this.setErrorTo(stateKey, '')
    }
  }

  validateUrlRpcUrl = (url, stateKey) => {
    const { rpcUrls } = this.props

    if (!validUrl.isWebUri(url) && url !== '') {
      this.setErrorTo(
        stateKey,
        this.context.t(
          this.isValidWhenAppended(url) ? 'urlErrorMsg' : 'invalidRPC',
        ),
      )
    } else if (rpcUrls.includes(url)) {
      this.setErrorTo(stateKey, this.context.t('urlExistsErrorMsg'))
    } else {
      this.setErrorTo(stateKey, '')
    }
  }

  renderWarning() {
    const { t } = this.context
    return (
      <div className="networks-tab__network-form-row--warning">
        {t('onlyAddTrustedNetworks')}
      </div>
    )
  }

  render() {
    const { t } = this.context
    const { viewOnly, isCurrentRpcTarget, networksTabIsInAddMode } = this.props
    const {
      networkName,
      rpcUrl,
      chainId = '',
      ticker,
      blockExplorerUrl,
      errors,
    } = this.state

    const deletable =
      !networksTabIsInAddMode && !isCurrentRpcTarget && !viewOnly

    const isSubmitDisabled =
      this.stateIsUnchanged() ||
      !rpcUrl ||
      !chainId ||
      Object.values(errors).some((x) => x)

    return (
      <div className="networks-tab__network-form">
        {viewOnly ? null : this.renderWarning()}
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
          this.setStateWithValue('chainId', this.validateChainIdOnChange),
          chainId,
          null,
          viewOnly ? null : t('networkSettingsChainIdDescription'),
        )}
        {this.renderFormTextField(
          'symbol',
          'network-ticker',
          this.setStateWithValue('ticker'),
          ticker,
          'optionalCurrencySymbol',
        )}
        {this.renderFormTextField(
          'blockExplorerUrl',
          'block-explorer-url',
          this.setStateWithValue(
            'blockExplorerUrl',
            this.validateBlockExplorerURL,
          ),
          blockExplorerUrl,
          'optionalBlockExplorerUrl',
        )}
        <div className="network-form__footer">
          {!viewOnly && (
            <>
              {deletable && (
                <Button type="danger" onClick={this.onDelete}>
                  {t('delete')}
                </Button>
              )}
              <Button
                type="default"
                onClick={this.onCancel}
                disabled={this.stateIsUnchanged()}
              >
                {t('cancel')}
              </Button>
              <Button
                type="secondary"
                disabled={isSubmitDisabled}
                onClick={this.onSubmit}
              >
                {t('save')}
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }
}
