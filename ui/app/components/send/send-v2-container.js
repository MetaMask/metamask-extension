const connect = require('react-redux').connect
const SendEther = require('../../send-v2')

const {
  accountsWithSendEtherInfoSelector,
  getCurrentAccountWithSendEtherInfo,
  conversionRateSelector,
} = require('../../selectors')

module.exports = connect(mapStateToProps, mapDispatchToProps)(SendEther)

function mapStateToProps (state) {
  return {
    selectedAccount: getCurrentAccountWithSendEtherInfo(state),
    accounts: accountsWithSendEtherInfoSelector(state),
    conversionRate: conversionRateSelector(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showCustomizeGasModal: () => dispatch(showModal({ name: 'CUSTOMIZE_GAS' })),
  }
}
