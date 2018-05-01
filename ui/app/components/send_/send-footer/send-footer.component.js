import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainerFooter from '../../page-container/page-container-footer'
import { CONFIRM_TRANSACTION_ROUTE, DEFAULT_ROUTE } from '../../../routes'

export default class SendFooter extends Component {

  static propTypes = {
    addToAddressBookIfNew: PropTypes.func,
    amount: PropTypes.string,
    clearSend: PropTypes.func,
    disabled: PropTypes.bool,
    editingTransactionId: PropTypes.string,
    errors: PropTypes.object,
    from: PropTypes.object,
    gasLimit: PropTypes.string,
    gasPrice: PropTypes.string,
    gasTotal: PropTypes.string,
    history: PropTypes.object,
    selectedToken: PropTypes.object,
    sign: PropTypes.func,
    to: PropTypes.string,
    toAccounts: PropTypes.array,
    tokenBalance: PropTypes.string,
    unapprovedTxs: PropTypes.object,
    update: PropTypes.func,
  };

  onSubmit (event) {
    event.preventDefault()
    const {
      addToAddressBookIfNew,
      amount,
      editingTransactionId,
      from: {address: from},
      gasLimit: gas,
      gasPrice,
      selectedToken,
      sign,
      to,
      unapprovedTxs,
      // updateTx,
      update,
      toAccounts,
    } = this.props

    // Should not be needed because submit should be disabled if there are no errors.
    // const noErrors = !amountError && toError === null

    // if (!noErrors) {
    //   return
    // }

    // TODO: add nickname functionality
    addToAddressBookIfNew(to, toAccounts)

    editingTransactionId
      ? update({
        amount,
        editingTransactionId,
        from,
        gas,
        gasPrice,
        selectedToken,
        to,
        unapprovedTxs,
      })
      : sign({ selectedToken, to, amount, from, gas, gasPrice })

    this.props.history.push(CONFIRM_TRANSACTION_ROUTE)
  }


  render () {
    const { clearSend, disabled, history } = this.props

    return (
      <PageContainerFooter
        onCancel={() => {
          clearSend()
          history.push(DEFAULT_ROUTE)
        }}
        onSubmit={e => this.onSubmit(e)}
        disabled={disabled}
      />
    )
  }

}

SendFooter.contextTypes = {
  t: PropTypes.func,
}
