import React from 'react';
import { shallow } from 'enzyme';
import TextField from '../../components/ui/text-field';
import Settings from './settings.container';
import SettingsSearch from './settings-search';

describe('SettingsPage', () => {
  let wrapper;

  const props = {
    isAddressEntryPage: false,
    backRoute: '/',
    currentPath: '/settings',
    location: '/settings',
    mostRecentOverviewPage: '',
    isPopup: false,
    pathnameI18nKey: undefined,
    addressName: '',
    initialBreadCrumbRoute: undefined,
    initialBreadCrumbKey: undefined,
    addNewNetwork: false,
    conversionDate: Date.now(),
  };

  beforeEach(() => {
    wrapper = shallow(<Settings.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    });
  });

  it('should render title correctly', () => {
    expect(
      wrapper.find('.settings-page__header__title-container__title').text(),
    ).toStrictEqual('settings');
  });

  it('should render search correctly', () => {
    wrapper = shallow(
      <SettingsSearch onSearch={() => undefined} settingsRoutesList={[]} />,
      {
        context: {
          t: (s) => `${s}`,
        },
      },
    );

    expect(wrapper.find(TextField).props().id).toStrictEqual('search-settings');
    expect(wrapper.find(TextField).props().value).toStrictEqual('');
  });
});
