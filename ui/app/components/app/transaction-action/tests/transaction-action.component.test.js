import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import TransactionAction from '../transaction-action.component'

describe('TransactionAction Component', () => {
  const t = key => key


  describe('Outgoing transaction', () => {
    beforeEach(() => {
      global.eth = {
        getCode: sinon.stub().callsFake(address => {
          const code = address === 'approveAddress' ? 'contract' : '0x'
          return Promise.resolve(code)
        }),
      }
    })

    it('should render Sent Ether', () => {
      const methodData = { data: {}, done: true, error: null }
      const transaction = {
        id: 1,
        status: 'confirmed',
        submittedTime: 1534045442919,
        time: 1534045440641,
        txParams: {
          from: '0xc5ae6383e126f901dcb06131d97a88745bfa88d6',
          gas: '0x5208',
          gasPrice: '0x3b9aca00',
          nonce: '0x96',
          to: 'sentEtherAddress',
          value: '0x2386f26fc10000',
        },
      }

      const wrapper = shallow(<TransactionAction
        methodData={methodData}
        transaction={transaction}
        className="transaction-action"
      />, { context: { t }})

      assert.equal(wrapper.find('.transaction-action').length, 1)
      wrapper.setState({ transactionAction: 'sentEther' })
      assert.equal(wrapper.text(), 'sentEther')
    })

    it('should render Approved', async () => {
      const methodData = {
        name: 'Approve',
      }
      const transaction = {
        id: 1,
        status: 'confirmed',
        submittedTime: 1534045442919,
        time: 1534045440641,
        txParams: {
          from: '0xc5ae6383e126f901dcb06131d97a88745bfa88d6',
          gas: '0x5208',
          gasPrice: '0x3b9aca00',
          nonce: '0x96',
          to: 'approveAddress',
          value: '0x2386f26fc10000',
          data: '0x095ea7b300000000000000000000000050a9d56c2b8ba9a5c7f2c08c3d26e0499f23a7060000000000000000000000000000000000000000000000000000000000000003',
        },
        transactionCategory: 'contractInteraction',
      }

      const wrapper = shallow(
        <TransactionAction
          methodData={methodData}
          transaction={transaction}
          className="test-class"
        />,
        { context: { t } }
      )

      assert.ok(wrapper)
      assert.equal(wrapper.find('.transaction-action').length, 1)
      assert.equal(wrapper.find('.transaction-action').text().trim(), 'Approve')
    })

    it('should render contractInteraction', async () => {
      const methodData = {}
      const transaction = {
        id: 1,
        status: 'confirmed',
        submittedTime: 1534045442919,
        time: 1534045440641,
        txParams: {
          from: '0xc5ae6383e126f901dcb06131d97a88745bfa88d6',
          gas: '0x5208',
          gasPrice: '0x3b9aca00',
          nonce: '0x96',
          to: 'approveAddress',
          value: '0x2386f26fc10000',
          data: '0x095ea7b300000000000000000000000050a9d56c2b8ba9a5c7f2c08c3d26e0499f23a7060000000000000000000000000000000000000000000000000000000000000003',
        },
        transactionCategory: 'contractInteraction',
      }

      const wrapper = shallow(
        <TransactionAction
          methodData={methodData}
          transaction={transaction}
          className="test-class"
        />,
        { context: { t }}
      )

      assert.ok(wrapper)
      assert.equal(wrapper.find('.transaction-action').length, 1)
      assert.equal(wrapper.find('.transaction-action').text().trim(), 'contractInteraction')
    })
  })
})
