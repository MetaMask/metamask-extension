const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const { connect } = require('react-redux')
const actions = require('../../../actions')
const NotifcationModal = require('../notification-modal')
const t = require('../../../../i18n')

class ConfirmResetAccount extends Component {
  render () {
    const { resetAccount } = this.props

    return h(NotifcationModal, {
      header: 'Are you sure you want to reset account?',
      message: h('div', [

        h('span', `Resetting is for developer use only. This button wipes the current account's transaction history,
          which is used to calculate the current account nonce. `),

        h('a.notification-modal__link', {
          href: 'http://metamask.helpscoutdocs.com/article/36-resetting-an-account',
          target: '_blank',
          onClick (event) { global.platform.openWindow({ url: event.target.href }) },
        }, t('readMore2')),

      ]),
      showCancelButton: true,
      showConfirmButton: true,
      onConfirm: resetAccount,
      
    })
  }
}

ConfirmResetAccount.propTypes = {
  resetAccount: PropTypes.func,
}

const mapDispatchToProps = dispatch => {
  return {
    resetAccount: () => {
      dispatch(actions.resetAccount())
    },
  }
}

module.exports = connect(null, mapDispatchToProps)(ConfirmResetAccount)
