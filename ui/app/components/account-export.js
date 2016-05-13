const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const actions = require('../actions')

module.exports = ExportAccountView


inherits(ExportAccountView, Component)
function ExportAccountView() {
  Component.call(this)
}

ExportAccountView.prototype.render = function() {
  console.log("EXPORT VIEW")
  console.dir(this.props)
  var state = this.props
  var accountDetail = state.accountDetail

  if (!accountDetail) return h('div')
  var accountExport = accountDetail.accountExport

  var notExporting = accountExport === 'none'
  var exportRequested = accountExport === 'requested'
  var accountExported = accountExport === 'completed'

  if (notExporting) return h('div')

  if (exportRequested) {
    var warning = `Exporting your private key is very dangerous,
      and you should only do it if you know what you're doing.`
    var confirmation = `If you're absolutely sure, type "I understand" below and
                        submit.`
    return (

      h('div', {
        key: 'exporting',
        style: {
          margin: '0 20px',
        },
      }, [
        h('p.error', warning),
        h('p', confirmation),
        h('input#exportAccount', {
          onKeyPress: this.onExportKeyPress.bind(this),
        }),
        h('button', {
          onClick: () => this.onExportKeyPress({ key: 'Enter', preventDefault: () => {} }),
        }, 'Submit'),
        h('button', {
          onClick: () => this.props.dispatch(actions.backToAccountDetail(this.props.address))
        }, 'Cancel'),
      ])

    )
  }

  if (accountExported) {
    return h('div.privateKey', {

    }, [
      h('label', 'Your private key (click to copy):'),
      h('p.error.cursor-pointer', {
        style: {
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          webkitUserSelect: 'text',
          width: '100%',
        },
        onClick: function(event) {
          copyToClipboard(accountDetail.privateKey)
        }
      }, accountDetail.privateKey),
      h('button', {
        onClick: () => this.props.dispatch(actions.backToAccountDetail(this.props.address))
      }, 'Done'),
    ])
  }
}

ExportAccountView.prototype.onExportKeyPress = function(event) {
  if (event.key !== 'Enter') return
  event.preventDefault()

  var input = document.getElementById('exportAccount')
  if (input.value === 'I understand') {
    this.props.dispatch(actions.exportAccount(this.props.address))
  } else {
    input.value = ''
    input.placeholder = 'Please retype "I understand" exactly.'
  }
}

ExportAccountView.prototype.exportAccount = function(address) {
  this.props.dispatch(actions.exportAccount(address))
}
