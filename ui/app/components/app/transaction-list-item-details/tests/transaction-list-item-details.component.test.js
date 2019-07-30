import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import TransactionListItemDetails from '../transaction-list-item-details.component'
import Button from '../../../ui/button'
import SenderToRecipient from '../../../ui/sender-to-recipient'
import TransactionBreakdown from '../../transaction-breakdown'
import TransactionActivityLog from '../../transaction-activity-log'

describe('TransactionListItemDetails Component', () => {
  it('should render properly', () => {
    const transaction = {
      history: [],
      id: 1,
      status: 'confirmed',
      txParams: {
        from: '0x1',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        nonce: '0xa4',
        to: '0x2',
        value: '0x2386f26fc10000',
      },
    }

    const transactionGroup = {
      transactions: [transaction],
      primaryTransaction: transaction,
      initialTransaction: transaction,
    }

    const wrapper = shallow(
      <TransactionListItemDetails
        transactionGroup={transactionGroup}
      />,
      { context: { t: (str1, str2) => str2 ? str1 + str2 : str1 } }
    )

    assert.ok(wrapper.hasClass('transaction-list-item-details'))
    assert.equal(wrapper.find(Button).length, 2)
    assert.equal(wrapper.find(SenderToRecipient).length, 1)
    assert.equal(wrapper.find(TransactionBreakdown).length, 1)
    assert.equal(wrapper.find(TransactionActivityLog).length, 1)
  })

  it('should render a retry button', () => {
    const transaction = {
      history: [],
      id: 1,
      status: 'confirmed',
      txParams: {
        from: '0x1',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        nonce: '0xa4',
        to: '0x2',
        value: '0x2386f26fc10000',
      },
    }

    const transactionGroup = {
      transactions: [transaction],
      primaryTransaction: transaction,
      initialTransaction: transaction,
      nonce: '0xa4',
      hasRetried: false,
      hasCancelled: false,
    }

    const wrapper = shallow(
      <TransactionListItemDetails
        transactionGroup={transactionGroup}
        showRetry={true}
      />,
      { context: { t: (str1, str2) => str2 ? str1 + str2 : str1 } }
    )

    assert.ok(wrapper.hasClass('transaction-list-item-details'))
    assert.equal(wrapper.find(Button).length, 3)
  })

  it('should disable the Copy Tx ID and View In Etherscan buttons when tx hash is missing', () => {
    const transaction = {
      history: [],
      id: 1,
      status: 'confirmed',
      txParams: {
        from: '0x1',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        nonce: '0xa4',
        to: '0x2',
        value: '0x2386f26fc10000',
      },
    }

    const transactionGroup = {
      transactions: [transaction],
      primaryTransaction: transaction,
      initialTransaction: transaction,
    }

    const wrapper = shallow(
      <TransactionListItemDetails
        transactionGroup={transactionGroup}
      />,
      { context: { t: (str1, str2) => str2 ? str1 + str2 : str1 } }
    )

    assert.ok(wrapper.hasClass('transaction-list-item-details'))
    const buttons = wrapper.find(Button)
    assert.strictEqual(buttons.at(0).prop('disabled'), true)
    assert.strictEqual(buttons.at(1).prop('disabled'), true)
  })

  it('should render functional Copy Tx ID and View In Etherscan buttons when tx hash exists', () => {
    const transaction = {
      history: [],
      id: 1,
      status: 'confirmed',
      hash: '0xaa',
      txParams: {
        from: '0x1',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        nonce: '0xa4',
        to: '0x2',
        value: '0x2386f26fc10000',
      },
    }

    const transactionGroup = {
      transactions: [transaction],
      primaryTransaction: transaction,
      initialTransaction: transaction,
    }

    const wrapper = shallow(
      <TransactionListItemDetails
        transactionGroup={transactionGroup}
      />,
      { context: { t: (str1, str2) => str2 ? str1 + str2 : str1 } }
    )

    assert.ok(wrapper.hasClass('transaction-list-item-details'))
    const buttons = wrapper.find(Button)
    assert.strictEqual(buttons.at(0).prop('disabled'), false)
    assert.strictEqual(buttons.at(1).prop('disabled'), false)
  })
})
