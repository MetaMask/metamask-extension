import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Button from '../../button';
import PageFooter from './page-container-footer.component';

describe('Page Footer', () => {
  let wrapper;
  const onCancel = sinon.spy();
  const onSubmit = sinon.spy();

  beforeEach(() => {
    wrapper = shallow(
      <PageFooter
        onCancel={onCancel}
        onSubmit={onSubmit}
        cancelText="Cancel"
        submitText="Submit"
        disabled={false}
        submitButtonType="Test Type"
      />,
    );
  });

  it('renders page container footer', () => {
    expect(wrapper.find('.page-container__footer')).toHaveLength(1);
  });

  it('should render a secondary footer inside page-container__footer when given children', () => {
    wrapper = shallow(
      <PageFooter>
        <div>Works</div>
      </PageFooter>,
      { context: { t: sinon.spy((k) => `[${k}]`) } },
    );

    expect(wrapper.find('.page-container__footer-secondary')).toHaveLength(1);
  });

  it('renders two button components', () => {
    expect(wrapper.find(Button)).toHaveLength(2);
  });

  describe('Cancel Button', () => {
    it('has button type of default', () => {
      expect(
        wrapper.find('.page-container__footer-button').first().prop('type'),
      ).toStrictEqual('default');
    });

    it('has children text of Cancel', () => {
      expect(
        wrapper.find('.page-container__footer-button').first().prop('children'),
      ).toStrictEqual('Cancel');
    });

    it('should call cancel when click is simulated', () => {
      wrapper.find('.page-container__footer-button').first().prop('onClick')();
      expect(onCancel.callCount).toStrictEqual(1);
    });
  });

  describe('Submit Button', () => {
    it('assigns button type based on props', () => {
      expect(
        wrapper.find('.page-container__footer-button').last().prop('type'),
      ).toStrictEqual('Test Type');
    });

    it('has disabled prop', () => {
      expect(
        wrapper.find('.page-container__footer-button').last().prop('disabled'),
      ).toStrictEqual(false);
    });

    it('has children text when submitText prop exists', () => {
      expect(
        wrapper.find('.page-container__footer-button').last().prop('children'),
      ).toStrictEqual('Submit');
    });

    it('should call submit when click is simulated', () => {
      wrapper.find('.page-container__footer-button').last().prop('onClick')();
      expect(onSubmit.callCount).toStrictEqual(1);
    });
  });
});
