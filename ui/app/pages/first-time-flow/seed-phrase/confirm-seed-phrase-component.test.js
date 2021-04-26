import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import ConfirmSeedPhrase from './confirm-seed-phrase/confirm-seed-phrase.component';

function shallowRender(props = {}, context = {}) {
  return shallow(<ConfirmSeedPhrase {...props} />, {
    context: {
      t: (str) => `${str}_t`,
      ...context,
    },
  });
}

describe('ConfirmSeedPhrase Component', () => {
  it('should render correctly', () => {
    const root = shallowRender({
      seedPhrase: '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬',
    });

    expect(root.find('.confirm-seed-phrase__seed-word--sorted')).toHaveLength(
      12,
    );
  });

  it('should add/remove selected on click', () => {
    const metricsEventSpy = sinon.spy();
    const pushSpy = sinon.spy();
    const root = shallowRender(
      {
        seedPhrase: '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬',
        history: { push: pushSpy },
      },
      {
        metricsEvent: metricsEventSpy,
      },
    );

    const seeds = root.find('.confirm-seed-phrase__seed-word--sorted');

    // Click on 3 seeds to add to selected
    seeds.at(0).simulate('click');
    seeds.at(1).simulate('click');
    seeds.at(2).simulate('click');

    expect(root.state().selectedSeedIndices).toStrictEqual([0, 1, 2]);

    // Click on a selected seed to remove
    root.state();
    root.update();
    root.state();
    root
      .find('.confirm-seed-phrase__seed-word--sorted')
      .at(1)
      .simulate('click');
    expect(root.state().selectedSeedIndices).toStrictEqual([0, 2]);
  });

  it('should render correctly on hover', () => {
    const metricsEventSpy = sinon.spy();
    const pushSpy = sinon.spy();
    const root = shallowRender(
      {
        seedPhrase: '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬',
        history: { push: pushSpy },
      },
      {
        metricsEvent: metricsEventSpy,
      },
    );

    const seeds = root.find('.confirm-seed-phrase__seed-word--sorted');

    // Click on 3 seeds to add to selected
    seeds.at(0).simulate('click');
    seeds.at(1).simulate('click');
    seeds.at(2).simulate('click');

    // Dragging Seed # 2 to 0 placeth
    root.instance().setDraggingSeedIndex(2);
    root.instance().setHoveringIndex(0);

    root.update();

    const pendingSeeds = root.find(
      '.confirm-seed-phrase__selected-seed-words__pending-seed',
    );

    expect(pendingSeeds.at(0).props().seedIndex).toStrictEqual(2);
    expect(pendingSeeds.at(1).props().seedIndex).toStrictEqual(0);
    expect(pendingSeeds.at(2).props().seedIndex).toStrictEqual(1);
  });

  it('should insert seed in place on drop', () => {
    const metricsEventSpy = sinon.spy();
    const pushSpy = sinon.spy();
    const root = shallowRender(
      {
        seedPhrase: '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬',
        history: { push: pushSpy },
      },
      {
        metricsEvent: metricsEventSpy,
      },
    );

    const seeds = root.find('.confirm-seed-phrase__seed-word--sorted');

    // Click on 3 seeds to add to selected
    seeds.at(0).simulate('click');
    seeds.at(1).simulate('click');
    seeds.at(2).simulate('click');

    // Drop Seed # 2 to 0 placeth
    root.instance().setDraggingSeedIndex(2);
    root.instance().setHoveringIndex(0);
    root.instance().onDrop(0);

    root.update();

    expect(root.state().selectedSeedIndices).toStrictEqual([2, 0, 1]);
    expect(root.state().pendingSeedIndices).toStrictEqual([2, 0, 1]);
  });

  it('should submit correctly', async () => {
    const originalSeed = [
      '鼠',
      '牛',
      '虎',
      '兔',
      '龍',
      '蛇',
      '馬',
      '羊',
      '猴',
      '雞',
      '狗',
      '豬',
    ];
    const metricsEventSpy = sinon.spy();
    const pushSpy = sinon.spy();
    const initialize3BoxSpy = sinon.spy();
    const root = shallowRender(
      {
        seedPhrase: '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬',
        history: { push: pushSpy },
        setSeedPhraseBackedUp: () => Promise.resolve(),
        initializeThreeBox: initialize3BoxSpy,
      },
      {
        metricsEvent: metricsEventSpy,
      },
    );

    const sorted = root.state().sortedSeedWords;
    const seeds = root.find('.confirm-seed-phrase__seed-word--sorted');

    originalSeed.forEach((seed) => {
      const seedIndex = sorted.findIndex((s) => s === seed);
      seeds.at(seedIndex).simulate('click');
    });

    root.update();

    root.find('.first-time-flow__button').simulate('click');

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(metricsEventSpy.args[0][0]).toStrictEqual({
      eventOpts: {
        category: 'Onboarding',
        action: 'Seed Phrase Setup',
        name: 'Verify Complete',
      },
    });
    expect(initialize3BoxSpy.calledOnce).toStrictEqual(true);
    expect(pushSpy.args[0][0]).toStrictEqual('/initialize/end-of-flow');
  });
});
