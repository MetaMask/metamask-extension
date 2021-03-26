import assert from 'assert';
import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import TextField from '../../../components/ui/text-field';
import AdvancedTab from './advanced-tab.component';

describe('AdvancedTab Component', function () {
  it('should render correctly when threeBoxFeatureFlag', function () {
    const root = shallow(
      <AdvancedTab
        ipfsGateway=""
        setAutoLockTimeLimit={() => undefined}
        setIpfsGateway={() => undefined}
        setShowFiatConversionOnTestnetsPreference={() => undefined}
        setThreeBoxSyncingPermission={() => undefined}
        threeBoxDisabled
        threeBoxSyncingAllowed={false}
      />,
      {
        context: {
          t: (s) => `_${s}`,
        },
      },
    );

    assert.strictEqual(root.find('.settings-page__content-row').length, 10);
  });

  it('should update autoLockTimeLimit', function () {
    const setAutoLockTimeLimitSpy = sinon.spy();
    const root = shallow(
      <AdvancedTab
        ipfsGateway=""
        setAutoLockTimeLimit={setAutoLockTimeLimitSpy}
        setIpfsGateway={() => undefined}
        setShowFiatConversionOnTestnetsPreference={() => undefined}
        setThreeBoxSyncingPermission={() => undefined}
        threeBoxDisabled
        threeBoxSyncingAllowed={false}
      />,
      {
        context: {
          t: (s) => `_${s}`,
        },
      },
    );

    const autoTimeout = root.find('.settings-page__content-row').at(7);
    const textField = autoTimeout.find(TextField);

    textField.props().onChange({ target: { value: 1440 } });
    assert.strictEqual(root.state().autoLockTimeLimit, 1440);

    autoTimeout.find('.settings-tab__rpc-save-button').simulate('click');
    assert.strictEqual(setAutoLockTimeLimitSpy.args[0][0], 1440);
  });
});
