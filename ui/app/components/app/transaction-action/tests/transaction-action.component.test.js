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

    it('should render -- when methodData is still fetching', () => {
      const methodData = { data: {}, done: false, error: null }
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
          to: '0x50a9d56c2b8ba9a5c7f2c08c3d26e0499f23a706',
          value: '0x2386f26fc10000',
        },
      }

      const wrapper = shallow(<TransactionAction
        methodData={methodData}
        transaction={transaction}
        className="transaction-action"
      />, { context: { t }})

      assert.equal(wrapper.find('.transaction-action').length, 1)
      assert.equal(wrapper.text(), '--')
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
        data: {
          name: 'Approve',
          params: [
            { type: 'address' },
            { type: 'uint256' },
          ],
        },
        done: true,
        error: null,
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
      assert.equal(wrapper.find('.test-class').length, 1)
      await wrapper.instance().getTransactionAction()
      assert.equal(wrapper.state('transactionAction'), 'approve')
    })

    it('should render Accept Fulfillment', async () => {
      const methodData = {
        data: {
          name: 'AcceptFulfillment',
          params: [
            { type: 'address' },
            { type: 'uint256' },
          ],
        },
        done: true,
        error: null,
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
      assert.equal(wrapper.find('.test-class').length, 1)
      await wrapper.instance().getTransactionAction()
      assert.equal(wrapper.state('transactionAction'), ' Accept Fulfillment')
    })
  })
})
