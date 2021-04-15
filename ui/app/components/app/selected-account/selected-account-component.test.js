import React from 'react';
import { render } from 'enzyme';
import SelectedAccount from './selected-account.component';

describe('SelectedAccount Component', () => {
  it('should render checksummed address', () => {
    const wrapper = render(
      <SelectedAccount
        selectedIdentity={{
          name: 'testName',
          address: '0x1b82543566f41a7db9a9a75fc933c340ffb55c9d',
        }}
      />,
      { context: { t: () => undefined } },
    );
    // Checksummed version of address is displayed
    expect(wrapper.find('.selected-account__address').text()).toStrictEqual(
      '0x1B82...5C9D',
    );
    expect(wrapper.find('.selected-account__name').text()).toStrictEqual(
      'testName',
    );
  });
});
