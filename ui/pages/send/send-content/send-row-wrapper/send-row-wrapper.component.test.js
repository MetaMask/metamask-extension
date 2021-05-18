import React from 'react';
import { shallow } from 'enzyme';
import SendRowWrapper from './send-row-wrapper.component';

import SendRowErrorMessage from './send-row-error-message/send-row-error-message.container';

describe('SendContent Component', () => {
  let wrapper;

  describe('render', () => {
    beforeEach(() => {
      wrapper = shallow(
        <SendRowWrapper
          errorType="mockErrorType"
          label="mockLabel"
          showError={false}
        >
          <span>Mock Form Field</span>
        </SendRowWrapper>,
      );
    });

    it('should render a div with a send-v2__form-row class', () => {
      expect(wrapper.find('div.send-v2__form-row')).toHaveLength(1);
    });

    it('should render two children of the root div, with send-v2_form label and field classes', () => {
      expect(
        wrapper.find('.send-v2__form-row > .send-v2__form-label'),
      ).toHaveLength(1);
      expect(
        wrapper.find('.send-v2__form-row > .send-v2__form-field'),
      ).toHaveLength(1);
    });

    it('should render the label as a child of the send-v2__form-label', () => {
      expect(
        wrapper
          .find('.send-v2__form-row > .send-v2__form-label')
          .childAt(0)
          .text(),
      ).toStrictEqual('mockLabel');
    });

    it('should render its first child as a child of the send-v2__form-field', () => {
      expect(
        wrapper
          .find('.send-v2__form-row > .send-v2__form-field')
          .childAt(0)
          .text(),
      ).toStrictEqual('Mock Form Field');
    });

    it('should not render a SendRowErrorMessage if showError is false', () => {
      expect(wrapper.find(SendRowErrorMessage)).toHaveLength(0);
    });

    it('should render a SendRowErrorMessage with and errorType props if showError is true', () => {
      wrapper.setProps({ showError: true });
      expect(wrapper.find(SendRowErrorMessage)).toHaveLength(1);

      const expectedSendRowErrorMessage = wrapper
        .find('.send-v2__form-row > .send-v2__form-label')
        .childAt(1);
      expect(expectedSendRowErrorMessage.is(SendRowErrorMessage)).toStrictEqual(
        true,
      );
      expect(expectedSendRowErrorMessage.props()).toStrictEqual({
        errorType: 'mockErrorType',
      });
    });

    it('should render its second child as a child of the send-v2__form-field, if it has two children', () => {
      wrapper = shallow(
        <SendRowWrapper
          errorType="mockErrorType"
          label="mockLabel"
          showError={false}
        >
          <span>Mock Custom Label Content</span>
          <span>Mock Form Field</span>
        </SendRowWrapper>,
      );
      expect(
        wrapper
          .find('.send-v2__form-row > .send-v2__form-field')
          .childAt(0)
          .text(),
      ).toStrictEqual('Mock Form Field');
    });

    it('should render its first child as the last child of the send-v2__form-label, if it has two children', () => {
      wrapper = shallow(
        <SendRowWrapper
          errorType="mockErrorType"
          label="mockLabel"
          showError={false}
        >
          <span>Mock Custom Label Content</span>
          <span>Mock Form Field</span>
        </SendRowWrapper>,
      );
      expect(
        wrapper
          .find('.send-v2__form-row > .send-v2__form-label')
          .childAt(1)
          .text(),
      ).toStrictEqual('Mock Custom Label Content');
    });
  });
});
