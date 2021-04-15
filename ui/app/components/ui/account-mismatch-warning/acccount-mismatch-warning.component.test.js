import React from 'react';
import * as reactRedux from 'react-redux';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import InfoIcon from '../icon/info-icon.component';
import { getSelectedAccount } from '../../../selectors';
import AccountMismatchWarning from './account-mismatch-warning.component';

describe('AccountMismatchWarning', () => {
  beforeAll(() => {
    sinon.stub(reactRedux, 'useSelector').callsFake((selector) => {
      if (selector === getSelectedAccount) {
        return { address: 'mockedAddress' };
      }
      throw new Error(
        `${selector.name} is not cared for in the AccountMismatchWarning test useSelector stub`,
      );
    });
  });

  afterAll(() => {
    sinon.restore();
  });

  it('renders nothing when the addresses match', () => {
    const wrapper = shallow(<AccountMismatchWarning address="mockedAddress" />);
    expect(wrapper.find(InfoIcon)).toHaveLength(0);
  });
  it('renders a warning info icon when addresses do not match', () => {
    const wrapper = shallow(
      <AccountMismatchWarning address="mockedAddress2" />,
    );
    expect(wrapper.find(InfoIcon)).toHaveLength(1);
  });
});
