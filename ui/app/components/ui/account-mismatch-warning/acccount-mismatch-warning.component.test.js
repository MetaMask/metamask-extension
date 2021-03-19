import assert from 'assert';
import React from 'react';
import * as reactRedux from 'react-redux';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import InfoIcon from '../icon/info-icon.component';
import { getSelectedAccount } from '../../../selectors';
import AccountMismatchWarning from './account-mismatch-warning.component';

describe('AccountMismatchWarning', function () {
  before(function () {
    sinon.stub(reactRedux, 'useSelector').callsFake((selector) => {
      if (selector === getSelectedAccount) {
        return { address: 'mockedAddress' };
      }
      throw new Error(
        `${selector.name} is not cared for in the AccountMismatchWarning test useSelector stub`,
      );
    });
  });
  it('renders nothing when the addresses match', function () {
    const wrapper = shallow(<AccountMismatchWarning address="mockedAddress" />);
    assert.strictEqual(wrapper.find(InfoIcon).length, 0);
  });
  it('renders a warning info icon when addresses do not match', function () {
    const wrapper = shallow(
      <AccountMismatchWarning address="mockedAddress2" />,
    );
    assert.strictEqual(wrapper.find(InfoIcon).length, 1);
  });
  after(function () {
    sinon.restore();
  });
});
