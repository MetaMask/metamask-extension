import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import TextField from '../../../components/ui/text-field';
import { LEDGER_TRANSPORT_TYPES } from '../../../../shared/constants/hardware-wallets';
import ToggleButton from '../../../components/ui/toggle-button';
import AdvancedTab from './advanced-tab.component';

describe('AdvancedTab Component', () => {
  let component;
  let setAutoLockTimeLimitSpy = sinon.spy();
  const toggleTestnet = sinon.spy();
  const toggleTokenDetection = sinon.spy();

  beforeAll(() => {
    component = shallow(
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
        useTokenDetection
        setUseTokenDetection={toggleTokenDetection}
        userHasALedgerAccount
        backupUserData={() => undefined}
        restoreUserData={() => undefined}
      />,
      {
        context: {
          t: (s) => `_${s}`,
        },
      },
    );
  });

  it('should render correctly when threeBoxFeatureFlag', () => {
    expect(component.find('.settings-page__content-row')).toHaveLength(16);
  });

  it('should render backup button', () => {
    expect(component.find('.settings-page__content-row')).toHaveLength(16);

    expect(
      component
        .find('.settings-page__content-row')
        .at(10)
        .find('.settings-page__content-item'),
    ).toHaveLength(2);

    expect(
      component
        .find('.settings-page__content-row')
        .at(10)
        .find('.settings-page__content-item')
        .at(0)
        .find('.settings-page__content-description')
        .props().children,
    ).toStrictEqual('_backupUserDataDescription');

    expect(
      component
        .find('.settings-page__content-row')
        .at(10)
        .find('.settings-page__content-item')
        .at(1)
        .find('Button')
        .props().children,
    ).toStrictEqual('_backup');
  });

  it('should render restore button', () => {
    expect(component.find('.settings-page__content-row')).toHaveLength(16);

    expect(
      component
        .find('.settings-page__content-row')
        .at(11)
        .find('.settings-page__content-item'),
    ).toHaveLength(2);

    expect(
      component
        .find('.settings-page__content-row')
        .at(11)
        .find('.settings-page__content-item')
        .at(0)
        .find('.settings-page__content-description')
        .props().children,
    ).toStrictEqual('_restoreUserDataDescription');

    expect(
      component
        .find('.settings-page__content-row')
        .at(11)
        .find('.settings-page__content-item')
        .at(1)
        .find('label')
        .props().children,
    ).toStrictEqual('_restore');
  });

  it('should update autoLockTimeLimit', () => {
    setAutoLockTimeLimitSpy = sinon.spy();
    component = shallow(
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
        useTokenDetection
        setUseTokenDetection={toggleTokenDetection}
        userHasALedgerAccount
        backupUserData={() => undefined}
        restoreUserData={() => undefined}
      />,
      {
        context: {
          t: (s) => `_${s}`,
        },
      },
    );

    const autoTimeout = component.find('.settings-page__content-row').at(9);
    const textField = autoTimeout.find(TextField);

    textField.props().onChange({ target: { value: 1440 } });
    expect(component.state().autoLockTimeLimit).toStrictEqual(1440);

    autoTimeout.find('.settings-tab__rpc-save-button').simulate('click');
    expect(setAutoLockTimeLimitSpy.args[0][0]).toStrictEqual(1440);
  });

  it('should toggle show test networks', () => {
    const testNetworks = component.find('.settings-page__content-row').at(7);
    const toggleButton = testNetworks.find(ToggleButton);
    toggleButton.first().simulate('toggle');
    expect(toggleTestnet.calledOnce).toStrictEqual(true);
  });

  it('should toggle token detection', () => {
    component = shallow(
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
        useTokenDetection
        setUseTokenDetection={toggleTokenDetection}
        userHasALedgerAccount
        backupUserData={() => undefined}
        restoreUserData={() => undefined}
      />,
      {
        context: {
          trackEvent: () => undefined,
          t: (s) => `_${s}`,
        },
      },
    );
    const useTokenDetection = component
      .find('.settings-page__content-row')
      .at(4);
    const toggleButton = useTokenDetection.find(ToggleButton);
    toggleButton.first().simulate('toggle');
    expect(toggleTokenDetection.calledOnce).toStrictEqual(true);
  });
});
