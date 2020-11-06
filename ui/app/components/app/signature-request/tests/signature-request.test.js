import assert from 'assert'
import React from 'react'
import shallow from '../../../../../lib/shallow-with-context'
import SignatureRequest from '../signature-request.component'

describe('Signature Request Component', function () {
  describe('render', function () {
    const fromAddress = '0x123456789abcdef'
    it('should render a div with one child', function () {
      const wrapper = shallow(
        <SignatureRequest
          clearConfirmTransaction={() => undefined}
          cancel={() => undefined}
          sign={() => undefined}
          txData={{
            msgParams: {
              data: '{"message": {"from": {"name": "hello"}}}',
              from: fromAddress,
            },
          }}
          fromAccount={{ address: fromAddress }}
        />,
      )

      assert(wrapper.is('div'))
      assert.equal(wrapper.length, 1)
      assert(wrapper.hasClass('signature-request'))
    })
  })
})
