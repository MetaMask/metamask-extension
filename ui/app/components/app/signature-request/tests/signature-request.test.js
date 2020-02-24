import React from 'react'
import assert from 'assert'
import shallow from '../../../../../lib/shallow-with-context'
import SignatureRequest from '../signature-request.component'


describe('Signature Request Component', function () {
  describe('render', function () {
    it('should render a div with one child', function () {
      const wrapper = shallow((
        <SignatureRequest
          clearConfirmTransaction={() => {}}
          cancel={() => {}}
          sign={() => {}}
          txData={{
            msgParams: {
              data: '{"message": {"from": {"name": "hello"}}}',
              from: '0x123456789abcdef',
            },
          }}
        />
      ))

<<<<<<< HEAD
  beforeEach(() => {
    wrapper = shallow(<SignatureRequest txData={{
      msgParams: {
        data: '{"message": {"from": {"name": "hello"}}}',
        from: '0x123456789abcdef',
      } }} />)
  })

  describe('render', () => {
    it('should render a div with one child', () => {
=======
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
      assert(wrapper.is('div'))
      assert.equal(wrapper.length, 1)
      assert(wrapper.hasClass('signature-request'))
    })
  })
})
