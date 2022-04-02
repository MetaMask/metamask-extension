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
    const component = shallowRender({
      seedPhrase: '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬',
    });

    expect(
      component.find('.confirm-seed-phrase__seed-word--sorted'),
    ).toHaveLength(12);
  });

  it('should add/remove selected on click', () => {
    const trackEventSpy = sinon.spy();
    const replaceSpy = sinon.spy();
    const component = shallowRender(
      {
        seedPhrase: '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬',
        history: { replace: replaceSpy },
      },
      {
        trackEvent: trackEventSpy,
      },
    );

    const seeds = component.find('.confirm-seed-phrase__seed-word--sorted');

    // Click on 3 seeds to add to selected
    seeds.at(0).simulate('click');
    seeds.at(1).simulate('click');
    seeds.at(2).simulate('click');

    expect(component.state().selectedSeedIndices).toStrictEqual([0, 1, 2]);

    // Click on a selected seed to remove
    component.state();
    component.update();
    component.state();
    component
      .find('.confirm-seed-phrase__seed-word--sorted')
      .at(1)
      .simulate('click');
    expect(component.state().selectedSeedIndices).toStrictEqual([0, 2]);
  });

  it('should render correctly on hover', () => {
    const trackEventSpy = sinon.spy();
    const replaceSpy = sinon.spy();
    const component = shallowRender(
      {
        seedPhrase: '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬',
        history: { replace: replaceSpy },
      },
      {
        trackEvent: trackEventSpy,
      },
    );

    const seeds = component.find('.confirm-seed-phrase__seed-word--sorted');

    // Click on 3 seeds to add to selected
    seeds.at(0).simulate('click');
    seeds.at(1).simulate('click');
    seeds.at(2).simulate('click');

    // Dragging Seed # 2 to 0 placeth
    component.instance().setDraggingSeedIndex(2);
    component.instance().setHoveringIndex(0);

    component.update();

    const pendingSeeds = component.find(
      '.confirm-seed-phrase__selected-seed-words__pending-seed',
    );

    expect(pendingSeeds.at(0).props().seedIndex).toStrictEqual(2);
    expect(pendingSeeds.at(1).props().seedIndex).toStrictEqual(0);
    expect(pendingSeeds.at(2).props().seedIndex).toStrictEqual(1);
  });

  it('should insert seed in place on drop', () => {
    const trackEventSpy = sinon.spy();
    const replaceSpy = sinon.spy();
    const component = shallowRender(
      {
        seedPhrase: '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬',
        history: { replace: replaceSpy },
      },
      {
        trackEvent: trackEventSpy,
      },
    );

    const seeds = component.find('.confirm-seed-phrase__seed-word--sorted');

    // Click on 3 seeds to add to selected
    seeds.at(0).simulate('click');
    seeds.at(1).simulate('click');
    seeds.at(2).simulate('click');

    // Drop Seed # 2 to 0 placeth
    component.instance().setDraggingSeedIndex(2);
    component.instance().setHoveringIndex(0);
    component.instance().onDrop(0);

    component.update();

    expect(component.state().selectedSeedIndices).toStrictEqual([2, 0, 1]);
    expect(component.state().pendingSeedIndices).toStrictEqual([2, 0, 1]);
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
    const trackEventSpy = sinon.spy();
    const replaceSpy = sinon.spy();
    const initialize3BoxSpy = sinon.spy();
    const component = shallowRender(
      {
        seedPhrase: '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬',
        history: { replace: replaceSpy },
        setSeedPhraseBackedUp: () => Promise.resolve(),
        initializeThreeBox: initialize3BoxSpy,
      },
      {
        trackEvent: trackEventSpy,
      },
    );

    const sorted = component.state().sortedSeedWords;
    const seeds = component.find('.confirm-seed-phrase__seed-word--sorted');

    originalSeed.forEach((seed) => {
      const seedIndex = sorted.findIndex((s) => s === seed);
      seeds.at(seedIndex).simulate('click');
    });

    component.update();

    component.find('.first-time-flow__button').simulate('click');

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(trackEventSpy.args[0][0]).toStrictEqual({
      category: 'Onboarding',
      event: 'Verify Complete',
      properties: {
        action: 'Seed Phrase Setup',
        legacy_event: true,
      },
    });
    expect(initialize3BoxSpy.calledOnce).toStrictEqual(true);
    expect(replaceSpy.args[0][0]).toStrictEqual('/initialize/end-of-flow');
  });
});
