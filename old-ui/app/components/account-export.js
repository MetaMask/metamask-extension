const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const exportAsFile = require('../util').exportAsFile
const actions = require('../../../ui/app/actions')
const ethUtil = require('ethereumjs-util')
const connect = require('react-redux').connect
const CopyButton = require('./copy/copy-button')

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
    const warning = `Export private keys at your own risk`
    return (
      h('div', {
        style: {
          display: 'inline-block',
          textAlign: 'right',
          width: '100%',
        },
      },
        [
          h('div', {
            key: 'exporting',
            style: {
              margin: '0 30px',
            },
          }, [
            h('p.error', {
              style: {
                color: '#333333',
                marginBottom: '0px',
                marginTop: '30px',
              },
            }, warning),
            h('input#exportAccount.sizing-input', {
              type: 'password',
              placeholder: 'Confirm Password',
              onKeyPress: this.onExportKeyPress.bind(this),
              style: {
                position: 'relative',
                top: '27px',
                marginBottom: '20px',
                width: '100%',
                padding: '10px',
              },
            }),
          ]),
          h('div', {
            key: 'buttons',
            style: {
              margin: '25px 30px',
            },
          },
            [
              h('button.btn-violet', {
                onClick: () => this.props.dispatch(actions.backToAccountDetail(this.props.address)),
              }, 'Cancel'),
              h('button', {
                onClick: () => this.onExportKeyPress({ key: 'Enter', preventDefault: () => {} }),
              }, 'Submit'),
            ]),
          (this.props.warning) && (
          h('div', {style: {
              margin: '0 30px',
            }},
            [
              h('div.error', this.props.warning.split('-')),
            ]
          )
        ),
        ])
    )
  }

  if (accountExported) {
    const plainKey = ethUtil.stripHexPrefix(accountDetail.privateKey)

    return h('div.privateKey', {
      style: {
        margin: '30px 30px',
        width: '100%',
        textAlign: 'center',
      },
    }, [
      h('label', {
        style: {
          textAlign: 'center',
          fontFamily: 'Nunito Semibold',
        },
      }, 'Your private key'),
      h('div.flex-row', [
        h('p', {
          style: {
            paddingTop: '25px',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            webkitUserSelect: 'text',
            maxWidth: '275px',
            color: '#333333',
            textAlign: 'center',
            marginBottom: '0px',
          },
        }, plainKey),
        h('div', {
            style: {
              paddingTop: '25px',
            },
          }, h(CopyButton, {
            value: accountDetail.privateKey,
          })
        ),
      ]),
      h('div', {
        style: {
          textAlign: 'right',
          marginTop: '30px',
        },
      }, [
        h('button.btn-violet', {
          onClick: () => exportAsFile(`Nifty Wallet ${nickname} Private Key`, plainKey),
        }, 'Save as File'),
        h('button', {
          style: {
            marginLeft: '10px',
          },
          onClick: () => this.props.dispatch(actions.backToAccountDetail(this.props.address)),
        }, 'Done'),
      ]),
    ])
  }
}

ExportAccountView.prototype.componentWillUnmount = function () {
  this.props.dispatch(actions.displayWarning(''))
}

ExportAccountView.prototype.onExportKeyPress = function (event) {
  if (event.key !== 'Enter') return
  event.preventDefault()

  const input = document.getElementById('exportAccount').value
  this.props.dispatch(actions.exportAccount(input, this.props.address))
}
