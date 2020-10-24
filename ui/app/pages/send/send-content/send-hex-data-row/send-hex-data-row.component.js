import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper'
import { debounce } from 'lodash'

export default class SendHexDataRow extends Component {
  static propTypes = {
    inError: PropTypes.bool,
    updateSendHexData: PropTypes.func.isRequired,
    updateGas: PropTypes.func.isRequired,
    hasHexDataError: PropTypes.bool,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    hexDataValue: '',
  }

  constructor (props) {
    super(props)
    this.dUpdateHexData = debounce(this.updateHexData, 1000)
  }

  onInput = (event) => {
    const data = event.target.value.replace(/\n/g, '') || null
    this.setState({ hexDataValue: data || '' })
    this.dUpdateHexData(data)
  }

  updateHexData (data) {
    const { updateSendHexData, updateGas } = this.props
    updateSendHexData(data)
    updateGas({ data })
  }

  render () {
    const { inError, hasHexDataError } = this.props
    const { t } = this.context
    const { hexDataValue = '' } = this.state

    return (
      <SendRowWrapper
        label={`${t('hexData')}:`}
        showError={inError || hasHexDataError}
        errorType={hasHexDataError ? 'hexData' : 'amount'}
      >
        <textarea
          onInput={this.onInput}
          onChange={this.onInput}
          placeholder={`${t('optional')}:`}
          className="send-v2__hex-data__input"
          value={hexDataValue}
        />
      </SendRowWrapper>
    )
  }
}
