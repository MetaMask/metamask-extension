import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import TextField from '../../../components/ui/text-field';
import { LEDGER_TRANSPORT_TYPES } from '../../../../shared/constants/hardware-wallets';
import ToggleButton from '../../../components/ui/toggle-button';
import AdvancedTab from './advanced-tab.component';

describe('AdvancedTab Component', () => {
  let root;
  let setAutoLockTimeLimitSpy = sinon.spy();
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
        ledgerTransportType={LEDGER_TRANSPORT_TYPES.U2F}
        setLedgerTransportPreference={() => undefined}
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

  it('should update autoLockTimeLimit', () => {
    setAutoLockTimeLimitSpy = sinon.spy();
    root = shallow(
      <AdvancedTab
        ipfsGateway=""
        setAutoLockTimeLimit={setAutoLockTimeLimitSpy}
        setIpfsGateway={() => undefined}
        setShowFiatConversionOnTestnetsPreference={() => undefined}
        setThreeBoxSyncingPermission={() => undefined}
        threeBoxDisabled
        threeBoxSyncingAllowed={false}
        ledgerTransportType={LEDGER_TRANSPORT_TYPES.U2F}
        setLedgerTransportPreference={() => undefined}
        setDismissSeedBackUpReminder={() => undefined}
        dismissSeedBackUpReminder={false}
        setShowTestNetworks={toggleTestnet}
      />,
      {
        context: {
          t: (s) => `_${s}`,
        },
      },
    );

    const autoTimeout = root.find('.settings-page__content-row').at(8);
    const textField = autoTimeout.find(TextField);

    textField.props().onChange({ target: { value: 1440 } });
    expect(root.state().autoLockTimeLimit).toStrictEqual(1440);

    autoTimeout.find('.settings-tab__rpc-save-button').simulate('click');
    expect(setAutoLockTimeLimitSpy.args[0][0]).toStrictEqual(1440);
  });

  it('should toggle show test networks', () => {
    const testNetworks = root.find('.settings-page__content-row').at(6);
    const toggleButton = testNetworks.find(ToggleButton);
    toggleButton.first().simulate('toggle');
    expect(toggleTestnet.calledOnce).toStrictEqual(true);
  });
});
