import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import TransactionListItemDetails from '../transaction-list-item-details.component'
import Button from '../../../ui/button'
import SenderToRecipient from '../../../ui/sender-to-recipient'
import TransactionBreakdown from '../../transaction-breakdown'
import TransactionActivityLog from '../../transaction-activity-log'

describe('TransactionListItemDetails Component', function () {
  it('should render properly', function () {
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
        title="Test Transaction Details"
        recipientAddress="0x1"
        senderAddress="0x2"
        tryReverseResolveAddress={() => {}}
        transactionGroup={transactionGroup}
        senderNickname="sender-nickname"
        recipientNickname="recipient-nickname"
      />,
      { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } }
    )
    const child = wrapper.childAt(0)
    assert.ok(child.hasClass('transaction-list-item-details'))
    assert.equal(child.find(Button).length, 2)
    assert.equal(child.find(SenderToRecipient).length, 1)
    assert.equal(child.find(TransactionBreakdown).length, 1)
    assert.equal(child.find(TransactionActivityLog).length, 1)
  })

  it('should render a retry button', function () {
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
        recipientAddress="0x1"
        senderAddress="0x2"
        tryReverseResolveAddress={() => {}}
        transactionGroup={transactionGroup}
        showSpeedUp
        senderNickname="sender-nickname"
        recipientNickname="recipient-nickname"
      />,
      { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } }
    )

    const child = wrapper.childAt(0)

    assert.ok(child.hasClass('transaction-list-item-details'))
    assert.equal(child.find(Button).length, 3)
  })

  it('should disable the Copy Tx ID and View In Etherscan buttons when tx hash is missing', function () {
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
        recipientAddress="0x1"
        senderAddress="0x2"
        tryReverseResolveAddress={() => {}}
        transactionGroup={transactionGroup}
        senderNickname="sender-nickname"
        recipientNickname="recipient-nickname"
      />,
      { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } }
    )

    const child = wrapper.childAt(0)

    assert.ok(child.hasClass('transaction-list-item-details'))
    const buttons = child.find(Button)
    assert.strictEqual(buttons.at(0).prop('disabled'), true)
    assert.strictEqual(buttons.at(1).prop('disabled'), true)
  })

  it('should render functional Copy Tx ID and View In Etherscan buttons when tx hash exists', function () {
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
        recipientAddress="0x1"
        senderAddress="0x2"
        tryReverseResolveAddress={() => {}}
        transactionGroup={transactionGroup}
        senderNickname="sender-nickname"
        recipientNickname="recipient-nickname"
      />,
      { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } }
    )

    const child = wrapper.childAt(0)

    assert.ok(child.hasClass('transaction-list-item-details'))
    const buttons = child.find(Button)
    assert.strictEqual(buttons.at(0).prop('disabled'), false)
    assert.strictEqual(buttons.at(1).prop('disabled'), false)
  })
})
