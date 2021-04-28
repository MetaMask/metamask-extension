import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import * as i18nHook from '../../../hooks/useI18nContext';
import Tooltip from '../../ui/tooltip';
import TransactionStatus from './transaction-status.component';

describe('TransactionStatus Component', () => {
  beforeAll(() => {
    sinon.stub(i18nHook, 'useI18nContext').returns((str) => str.toUpperCase());
  });

  afterAll(() => {
    sinon.restore();
  });

  it('should render CONFIRMED properly', () => {
    const wrapper = mount(
      <TransactionStatus status="confirmed" date="June 1" />,
    );

    expect(wrapper.find(TransactionStatus)).toHaveLength(1);
    expect(wrapper.text()).toStrictEqual('June 1');
  });

  it('should render PENDING properly when status is APPROVED', () => {
    const wrapper = mount(
      <TransactionStatus
        status="approved"
        isEarliestNonce
        error={{ message: 'test-title' }}
      />,
    );

    expect(wrapper.text()).toStrictEqual('PENDING');
    expect(wrapper.find(Tooltip).props().title).toStrictEqual('test-title');
  });

  it('should render PENDING properly', () => {
    const wrapper = mount(
      <TransactionStatus date="June 1" status="submitted" isEarliestNonce />,
    );

    expect(wrapper.find(TransactionStatus)).toHaveLength(1);
    expect(wrapper.text()).toStrictEqual('PENDING');
  });

  it('should render QUEUED properly', () => {
    const wrapper = mount(<TransactionStatus status="queued" />);

    expect(wrapper.find(TransactionStatus)).toHaveLength(1);
    expect(wrapper.find('.transaction-status--queued')).toHaveLength(1);
    expect(wrapper.text()).toStrictEqual('QUEUED');
  });

  it('should render UNAPPROVED properly', () => {
    const wrapper = mount(<TransactionStatus status="unapproved" />);

    expect(wrapper.find(TransactionStatus)).toHaveLength(1);
    expect(wrapper.find('.transaction-status--unapproved')).toHaveLength(1);
    expect(wrapper.text()).toStrictEqual('UNAPPROVED');
  });
});
