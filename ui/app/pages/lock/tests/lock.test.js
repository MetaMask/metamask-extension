import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { mountWithRouter } from '../../../../../test/lib/render-helpers'
import Lock from '..'

describe('Lock', function () {
  it('replaces history with default route when isUnlocked false', function () {
    const props = {
      isUnlocked: false,
      history: {
        replace: sinon.spy(),
      },
    }

    mountWithRouter(<Lock.WrappedComponent {...props} />)

    assert.equal(props.history.replace.getCall(0).args[0], '/')
  })

  it('locks and pushes history with default route when isUnlocked true', function (done) {
    const props = {
      isUnlocked: true,
      lockMetamask: sinon.stub(),
      history: {
        push: sinon.spy(),
      },
    }

    props.lockMetamask.resolves()

    mountWithRouter(<Lock.WrappedComponent {...props} />)

    assert(props.lockMetamask.calledOnce)
    setImmediate(() => {
      assert.equal(props.history.push.getCall(0).args[0], '/')
      done()
    })
  })
})
