const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const copyToClipboard = require('copy-to-clipboard')
const actions = require('../actions')
const ethUtil = require('ethereumjs-util')
const connect = require('react-redux').connect

module.exports = connect(mapStateToProps)(ExportAccountView)

inherits(ExportAccountView, Component)
function ExportAccountView () {
  Component.call(this)
}

function mapStateToProps (state) {
  return {
    warning: state.appState.warning,
  }
}

ExportAccountView.prototype.render = function () {
  const state = this.props
  const accountDetail = state.accountDetail
  const nickname = state.identities[state.address].name

  if (!accountDetail) return h('div')
  const accountExport = accountDetail.accountExport

  const notExporting = accountExport === 'none'
  const exportRequested = accountExport === 'requested'
  const accountExported = accountExport === 'completed'

  if (notExporting) return h('div')

  if (exportRequested) {
    const warning = `Export private keys at your own risk.`
    return (
      h('div', {
        style: {
          display: 'inline-block',
          textAlign: 'center',
        },
      },
        [
          h('div', {
            key: 'exporting',
            style: {
              margin: '0 20px',
            },
          }, [
            h('p.error', warning),
            h('input#exportAccount.sizing-input', {
              type: 'password',
              placeholder: 'confirm password',
              onKeyPress: this.onExportKeyPress.bind(this),
              style: {
                position: 'relative',
                top: '1.5px',
                marginBottom: '7px',
              },
            }),
          ]),
          h('div', {
            key: 'buttons',
            style: {
              margin: '0 20px',
            },
          },
            [
              h('button', {
                onClick: () => this.onExportKeyPress({ key: 'Enter', preventDefault: () => {} }),
                style: {
                  marginRight: '10px',
                },
              }, 'Submit'),
              h('button', {
                onClick: () => this.props.dispatch(actions.backToAccountDetail(this.props.address)),
              }, 'Cancel'),
            ]),
          (this.props.warning) && (
          h('span.error', {
            style: {
              margin: '20px',
            },
          }, this.props.warning.split('-'))
        ),
        ])
    )
  }

  if (accountExported) {
    const plainKey = ethUtil.stripHexPrefix(accountDetail.privateKey)

    return h('div.privateKey', {
      style: {
        margin: '0 20px',
      },
    }, [
      h('label', 'Your private key (click to copy):'),
      h('p.error.cursor-pointer', {
        style: {
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          webkitUserSelect: 'text',
          maxWidth: '275px',
        },
        onClick: function (event) {
          copyToClipboard(ethUtil.stripHexPrefix(accountDetail.privateKey))
        },
      }, plainKey),
      h('button', {
        onClick: () => this.props.dispatch(actions.backToAccountDetail(this.props.address)),
      }, 'Done'),
      h('button', {
        onClick: () => this.exportAsFile(`MetaMask ${nickname} Private Key`, plainKey),
      }, 'Save as File'),
    ])
  }
}

ExportAccountView.prototype.onExportKeyPress = function (event) {
  if (event.key !== 'Enter') return
  event.preventDefault()

  const input = document.getElementById('exportAccount').value
  this.props.dispatch(actions.exportAccount(input, this.props.address))
}

ExportAccountView.prototype.exportAsFile = function (filename, data) {
  // source: https://stackoverflow.com/a/33542499 by Ludovic Feltz
  const blob = new Blob([data], {type: 'text/csv'})
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename)
  } else {
    const elem = window.document.createElement('a')
    elem.href = window.URL.createObjectURL(blob)
    elem.download = filename
    document.body.appendChild(elem)
    elem.click()
    document.body.removeChild(elem)
  }
}
