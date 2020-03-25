import React from 'react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import assert from 'assert'
import sinon from 'sinon'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import {
  INITIALIZE_SEED_PHRASE_ROUTE,
  INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE,
  INITIALIZE_BACKUP_SEED_PHRASE_ROUTE,
  DEFAULT_ROUTE,
} from '../../../../helpers/constants/routes'
import SeedPhrase from '../index'

describe('Seed Phrase', function () {

  let wrapper

  const TEST_SEED = 'debris dizzy just program just float decrease vacant alarm reduce speak stadium'

  const mockState = {
    metamask: {},
    appState: {
      showingSeedPhraseBackupAfterOnboarding: true,
    },
  }

  const store = configureStore()(mockState)

  const props = {
    history: {
      push: sinon.spy(),
    },
    seedPhrase: TEST_SEED,
    verifySeedPhrase: sinon.stub().resolves(),
  }

  after(function () {
    sinon.restore()
  })

  it('routes to default route when verifiedSeedPhrase is not verified', function () {
    const propTypes = {
      verifySeedPhrase: sinon.stub().resolves(null),
      history: {
        push: sinon.spy(),
      },
    }

    wrapper = mountWithRouter(
      <Provider store={store}>
        <SeedPhrase {...propTypes} />
      </Provider>
    )

    setImmediate(() => {
      assert(propTypes.history.push.calledOnce)
      assert.equal(propTypes.history.push.getCall(0).args[0], DEFAULT_ROUTE)
    })
  })

  it('sets verifed seed phrase in state on componentDidMount', function () {
    const verifiedSeedPhrase = 'verified seed phrase'

    const propTypes = {
      verifySeedPhrase: sinon.stub().resolves(verifiedSeedPhrase),
      history: {
        push: sinon.spy(),
      },
    }

    wrapper = mountWithRouter(
      <Provider store={store}>
        <SeedPhrase {...propTypes} />
      </Provider>
    )

    setImmediate(() => {
      assert.equal(wrapper.find('SeedPhrase').state('verifiedSeedPhrase'), verifiedSeedPhrase)
    })

  })

  it('renders confirm seed phrase component during confirm seed phrase route', function () {
    wrapper = mountWithRouter(
      <Provider store={store}>
        <SeedPhrase {...props} />
      </Provider>, INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE
    )
    assert.equal(wrapper.find('ConfirmSeedPhrase').length, 1)
  })

  it('renders reveal seed phrase component during initializing seed phrase route', function () {
    wrapper = mountWithRouter(
      <Provider store={store}>
        <SeedPhrase {...props} />
      </Provider>, INITIALIZE_SEED_PHRASE_ROUTE
    )
    assert.equal(wrapper.find('RevealSeedPhrase').length, 1)
  })

  it('renders reveal seed phrase component during back up seed phrase route', function () {
    wrapper = mountWithRouter(
      <Provider store={store}>
        <SeedPhrase {...props} />
      </Provider>, INITIALIZE_BACKUP_SEED_PHRASE_ROUTE
    )
    assert.equal(wrapper.find('RevealSeedPhrase').length, 1)
  })

})
