<<<<<<< HEAD
const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const copyToClipboard = require('copy-to-clipboard')
const { exportAsFile } = require('../../../helpers/utils/util')
=======
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import copyToClipboard from 'copy-to-clipboard'
import { exportAsFile } from '../../../helpers/utils/util'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

class ExportTextContainer extends Component {
  render () {
    const { text = '' } = this.props
    const { t } = this.context

    return (
<<<<<<< HEAD
      h('.export-text-container', [
        h('.export-text-container__text-container', [
          h('.export-text-container__text.notranslate', text),
        ]),
        h('.export-text-container__buttons-container', [
          h('.export-text-container__button.export-text-container__button--copy', {
            onClick: () => copyToClipboard(text),
          }, [
            h('img', { src: 'images/copy-to-clipboard.svg' }),
            h('.export-text-container__button-text', t('copyToClipboard')),
          ]),
          h('.export-text-container__button', {
            onClick: () => exportAsFile(filename, text),
          }, [
            h('img', { src: 'images/download.svg' }),
            h('.export-text-container__button-text', t('saveAsCsvFile')),
          ]),
        ]),
      ])
=======
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
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
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
