const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('../../metamask-connect')
const actions = require('../../actions')
const t = require('../../../i18n-helper').getMessage
const { getCurrentViewContext } = require('../../selectors')
const classnames = require('classnames')

const NewAccountCreateForm = require('./create-form')
const NewAccountImportForm = require('../import')

function mapStateToProps (state) {
  return {
    displayedForm: getCurrentViewContext(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    displayForm: form => dispatch(actions.setNewAccountForm(form)),
    showQrView: (selected, identity) => dispatch(actions.showQrView(selected, identity)),
    showExportPrivateKeyModal: () => {
      dispatch(actions.showModal({ name: 'EXPORT_PRIVATE_KEY' }))
    },
    hideModal: () => dispatch(actions.hideModal()),
    saveAccountLabel: (address, label) => dispatch(actions.saveAccountLabel(address, label)),
  }
}

inherits(AccountDetailsModal, Component)
function AccountDetailsModal (props) {
  Component.call(this)

  this.state = {
    displayedForm: props.displayedForm,
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(AccountDetailsModal)

AccountDetailsModal.prototype.render = function () {
  const { displayedForm, displayForm } = this.props

  return h('div.new-account', {}, [

    h('div.new-account__header', [

      h('div.new-account__title', t(this.props.localeMessages, 'newAccount')),

      h('div.new-account__tabs', [

        h('div.new-account__tabs__tab', {
          className: classnames('new-account__tabs__tab', {
            'new-account__tabs__selected': displayedForm === 'CREATE',
            'new-account__tabs__unselected cursor-pointer': displayedForm !== 'CREATE',
          }),
          onClick: () => displayForm('CREATE'),
        }, t(this.props.localeMessages, 'createDen')),

        h('div.new-account__tabs__tab', {
          className: classnames('new-account__tabs__tab', {
            'new-account__tabs__selected': displayedForm === 'IMPORT',
            'new-account__tabs__unselected cursor-pointer': displayedForm !== 'IMPORT',
          }),
          onClick: () => displayForm('IMPORT'),
        }, t(this.props.localeMessages, 'import')),

      ]),

    ]),

    h('div.new-account__form', [

      displayedForm === 'CREATE'
        ? h(NewAccountCreateForm)
        : h(NewAccountImportForm),

    ]),

  ])
}
