import React from 'react'
import { Provider } from 'react-redux'
import assert from 'assert'
import sinon from 'sinon'
import configureStore from 'redux-mock-store'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'

import {
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
  INITIALIZE_SEED_PHRASE_ROUTE,
} from '../../../../helpers/constants/routes'

import NewAccount from '../new-account'
import ImportWithSeedPhrase from '../import-with-seed-phrase'
import CreatePassword from '../index'

describe('Create Password', function () {

  it('pushes initialized seed phrase route when isInitialized is true', function () {

    const props = {
      isInitialized: true,
      history: {
        push: sinon.spy(),
      },
    }

    mountWithRouter(
      <CreatePassword.WrappedComponent {...props} />
    )
    assert(props.history.push.calledOnce)
    assert.equal(props.history.push.getCall(0).args[0], INITIALIZE_SEED_PHRASE_ROUTE)

  })

  it('import with seed phrase route', function () {

    const mockStore = {
      metamask: {},
    }

    const store = configureStore()(mockStore)

    const props = {
      onCreateNewAccountFromSeed: sinon.spy(),
    }

    const wrapper = mountWithRouter(
      <Provider store={store} >
        <CreatePassword.WrappedComponent {...props} />
      </Provider>, INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE
    )

    assert.equal(wrapper.find(ImportWithSeedPhrase).length, 1)
    assert.equal(wrapper.find(NewAccount).length, 0)
  })

  it('create account route', function () {

    const props = {
      onCreateNewAccount: sinon.spy(),
    }

    const wrapper = mountWithRouter(
      <CreatePassword.WrappedComponent {...props} />, INITIALIZE_CREATE_PASSWORD_ROUTE
    )

    assert.equal(wrapper.find(ImportWithSeedPhrase).length, 0)
    assert.equal(wrapper.find(NewAccount).length, 1)
  })
})
