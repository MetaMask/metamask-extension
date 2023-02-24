import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import NoteToTrader from '.';

describe('NoteToTrader', () => {
  it('should render the Note to trader component', () => {
    const props = {
      placeholder: '',
      maxLength: '280',
      noteText: 'some text',
      labelText: 'Transaction note',
      onChange: sinon.spy(),
    };

    const wrapper = mount(<NoteToTrader {...props} />);

    expect(wrapper.find('[data-testid="transaction-note"]')).toHaveLength(1);
  });
});
