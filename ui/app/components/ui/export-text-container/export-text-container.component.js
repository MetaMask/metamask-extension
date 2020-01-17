import React, { Component } from 'react'
import PropTypes from 'prop-types'
import copyToClipboard from 'copy-to-clipboard'
import { exportAsFile } from '../../../helpers/utils/util'

class ExportTextContainer extends Component {
  render () {
    const { text = '' } = this.props
    const { t } = this.context

    return (
      <div className="export-text-container">
        <div className="export-text-container__text-container">
          <div className="export-text-container__text notranslate">
            {text}
          </div>
        </div>
        <div className="export-text-container__buttons-container">
          <div
            className="export-text-container__button export-text-container__button--copy"
            onClick={() => copyToClipboard(text)}
          >
            <img src="images/copy-to-clipboard.svg" alt="" />
            <div className="export-text-container__button-text">
              {t('copyToClipboard')}
            </div>
          </div>
          <div
            className="export-text-container__button"
            onClick={() => exportAsFile('', text)}
          >
            <img src="images/download.svg" alt="" />
            <div className="export-text-container__button-text">
              {t('saveAsCsvFile')}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

ExportTextContainer.propTypes = {
  text: PropTypes.string,
}

ExportTextContainer.contextTypes = {
  t: PropTypes.func,
}

export default ExportTextContainer
