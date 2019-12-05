import React, { Component } from 'react'
const PropTypes = require('prop-types')
const copyToClipboard = require('copy-to-clipboard')
const { exportAsFile } = require('../../../helpers/utils/util')

class ExportTextContainer extends Component {
  render () {
    const { text = '', filename = '' } = this.props
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
            onClick={() => exportAsFile(filename, text)}
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
  filename: PropTypes.string,
}

ExportTextContainer.contextTypes = {
  t: PropTypes.func,
}

module.exports = ExportTextContainer
