import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import TextField from '../../../components/ui/text-field';
import AdvancedTab from './advanced-tab.component';
import ToggleButton from '../../../components/ui/toggle-button';

describe('AdvancedTab Component', () => {
  let root;
  const setAutoLockTimeLimitSpy = sinon.spy();
  const toggleTestnet = sinon.spy();

  beforeAll(() => {    
    root = shallow(
      <AdvancedTab
        ipfsGateway=""
        setAutoLockTimeLimit={setAutoLockTimeLimitSpy}
        setIpfsGateway={() => undefined}
        setShowFiatConversionOnTestnetsPreference={() => undefined}
        setThreeBoxSyncingPermission={() => undefined}
        setShowTestNetworks={toggleTestnet}
        showTestNetworks={false}
        threeBoxDisabled
        threeBoxSyncingAllowed={false}
        useLedgerLive={false}
        setLedgerLivePreference={() => undefined}
        setDismissSeedBackUpReminder={() => undefined}
        dismissSeedBackUpReminder={false}
      />,
      {
        context: {
          t: (s) => `_${s}`,
        },
      },
    );
  });

  it('should render correctly when threeBoxFeatureFlag', () => {
    expect(root.find('.settings-page__content-row')).toHaveLength(13);
  });

  it('should toggle show test networks', () => {
    const testNetworks = root.find('.settings-page__content-row').at(6);
    const toggleButton = testNetworks.find(ToggleButton);
    toggleButton.first().simulate('toggle');    
    expect(toggleTestnet.calledOnce).toStrictEqual(true);
  });

  it('should update autoLockTimeLimit', () => {    

    const autoTimeout = root.find('.settings-page__content-row').at(8);
    const textField = autoTimeout.find(TextField);

    textField.props().onChange({ target: { value: 1440 } });
    expect(root.state().autoLockTimeLimit).toStrictEqual(1440);

    autoTimeout.find('.settings-tab__rpc-save-button').simulate('click');
    expect(setAutoLockTimeLimitSpy.args[0][0]).toStrictEqual(1440);
  });
});
