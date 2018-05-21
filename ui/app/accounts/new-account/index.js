const Component = require('react').Component
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
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
    setAccountLabel: (address, label) => dispatch(actions.setAccountLabel(address, label)),
  }
}

inherits(AccountDetailsModal, Component)
function AccountDetailsModal (props) {
  Component.call(this)

  this.state = {
    displayedForm: props.displayedForm,
  }
}

AccountDetailsModal.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(AccountDetailsModal)


AccountDetailsModal.prototype.render = function () {
  const { displayedForm, displayForm } = this.props

  return h('div.new-account', {}, [

    h('div.new-account__header', [

      h('div.new-account__title', this.context.t('newAccount')),

      h('div.new-account__tabs', [

        h('div.new-account__tabs__tab', {
          className: classnames('new-account__tabs__tab', {
            'new-account__tabs__selected': displayedForm === 'CREATE',
            'new-account__tabs__unselected cursor-pointer': displayedForm !== 'CREATE',
          }),
          onClick: () => displayForm('CREATE'),
        }, this.context.t('createDen')),

        h('div.new-account__tabs__tab', {
          className: classnames('new-account__tabs__tab', {
            'new-account__tabs__selected': displayedForm === 'IMPORT',
            'new-account__tabs__unselected cursor-pointer': displayedForm !== 'IMPORT',
          }),
          onClick: () => displayForm('IMPORT'),
        }, this.context.t('import')),

      ]),

    ]),

    h('div.new-account__form', [

      displayedForm === 'CREATE'
        ? h(NewAccountCreateForm)
        : h(NewAccountImportForm),

    ]),

  ])
}
