import React from 'react'
import assert from 'assert'
import shallow from '../../../../../lib/shallow-with-context'
import SignatureRequest from '../signature-request.component'


describe('Signature Request Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow((
      <SignatureRequest
        txData={{
          msgParams: {
            data: '{"message": {"from": {"name": "hello"}}}',
            from: '0x123456789abcdef',
          },
        }}
      />
    ))
  })

  describe('render', () => {
    it('should render a div with one child', () => {
      assert(wrapper.is('div'))
      assert.equal(wrapper.length, 1)
      assert(wrapper.hasClass('signature-request'))
    })
  })
})
