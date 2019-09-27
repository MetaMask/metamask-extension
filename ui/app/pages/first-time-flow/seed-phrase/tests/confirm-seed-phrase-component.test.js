import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import ConfirmSeedPhrase from '../confirm-seed-phrase/confirm-seed-phrase.component'

function shallowRender (props = {}, context = {}) {
  return shallow(
    <ConfirmSeedPhrase {...props} />,
    {
      context: {
        t: str => str + '_t',
        ...context,
      },
    }
  )
}

describe('ConfirmSeedPhrase Component', () => {
  it('should render correctly', () => {
    const root = shallowRender({
      seedPhrase: '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬',
    })

    assert.equal(
      root.find('.confirm-seed-phrase__seed-word--shuffled').length,
      12,
      'should render 12 seed phrases'
    )
  })

  it('should add/remove selected on click', () => {
    const metricsEventSpy = sinon.spy()
    const pushSpy = sinon.spy()
    const root = shallowRender(
      {
        seedPhrase: '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬',
        history: { push: pushSpy },
      },
      {
        metricsEvent: metricsEventSpy,
      }
    )

    const seeds = root.find('.confirm-seed-phrase__seed-word--shuffled')

    // Click on 3 seeds to add to selected
    seeds.at(0).simulate('click')
    seeds.at(1).simulate('click')
    seeds.at(2).simulate('click')

    assert.deepEqual(
      root.state().selectedSeedIndices,
      [0, 1, 2],
      'should add seed phrase to selected on click',
    )

    // Click on a selected seed to remove
    root.state()
    root.update()
    root.state()
    root.find('.confirm-seed-phrase__seed-word--shuffled').at(1).simulate('click')
    assert.deepEqual(
      root.state().selectedSeedIndices,
      [0, 2],
      'should remove seed phrase from selected when click again',
    )
  })

  it('should render correctly on hover', () => {
    const metricsEventSpy = sinon.spy()
    const pushSpy = sinon.spy()
    const root = shallowRender(
      {
        seedPhrase: '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬',
        history: { push: pushSpy },
      },
      {
        metricsEvent: metricsEventSpy,
      }
    )

    const seeds = root.find('.confirm-seed-phrase__seed-word--shuffled')

    // Click on 3 seeds to add to selected
    seeds.at(0).simulate('click')
    seeds.at(1).simulate('click')
    seeds.at(2).simulate('click')

    // Dragging Seed # 2 to 0 placeth
    root.instance().setDraggingSeedIndex(2)
    root.instance().setHoveringIndex(0)

    root.update()

    const pendingSeeds = root.find('.confirm-seed-phrase__selected-seed-words__pending-seed')

    assert.equal(pendingSeeds.at(0).props().seedIndex, 2)
    assert.equal(pendingSeeds.at(1).props().seedIndex, 0)
    assert.equal(pendingSeeds.at(2).props().seedIndex, 1)
  })

  it('should insert seed in place on drop', () => {
    const metricsEventSpy = sinon.spy()
    const pushSpy = sinon.spy()
    const root = shallowRender(
      {
        seedPhrase: '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬',
        history: { push: pushSpy },
      },
      {
        metricsEvent: metricsEventSpy,
      }
    )

    const seeds = root.find('.confirm-seed-phrase__seed-word--shuffled')

    // Click on 3 seeds to add to selected
    seeds.at(0).simulate('click')
    seeds.at(1).simulate('click')
    seeds.at(2).simulate('click')

    // Drop Seed # 2 to 0 placeth
    root.instance().setDraggingSeedIndex(2)
    root.instance().setHoveringIndex(0)
    root.instance().onDrop(0)

    root.update()

    assert.deepEqual(root.state().selectedSeedIndices, [2, 0, 1])
    assert.deepEqual(root.state().pendingSeedIndices, [2, 0, 1])
  })

  it('should submit correctly', async () => {
    const originalSeed = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬']
    const metricsEventSpy = sinon.spy()
    const pushSpy = sinon.spy()
    const initialize3BoxSpy = sinon.spy()
    const root = shallowRender(
      {
        seedPhrase: '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬',
        history: { push: pushSpy },
        setSeedPhraseBackedUp: () => Promise.resolve(),
        initializeThreeBox: initialize3BoxSpy,
      },
      {
        metricsEvent: metricsEventSpy,
      }
    )

    const shuffled = root.state().shuffledSeedWords
    const seeds = root.find('.confirm-seed-phrase__seed-word--shuffled')


    originalSeed.forEach(seed => {
      const seedIndex = shuffled.findIndex(s => s === seed)
      seeds.at(seedIndex).simulate('click')
    })

    root.update()

    root.find('.first-time-flow__button').simulate('click')

    await (new Promise(resolve => setTimeout(resolve, 100)))

    assert.deepEqual(metricsEventSpy.args[0][0], {
      eventOpts: {
        category: 'Onboarding',
        action: 'Seed Phrase Setup',
        name: 'Verify Complete',
      },
    })
    assert(initialize3BoxSpy.calledOnce)
    assert.equal(pushSpy.args[0][0], '/initialize/end-of-flow')
  })
})
