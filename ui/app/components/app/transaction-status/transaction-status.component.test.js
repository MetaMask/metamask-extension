import assert from 'assert';
import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import * as i18nHook from '../../../hooks/useI18nContext';
import Tooltip from '../../ui/tooltip';
import TransactionStatus from './transaction-status.component';

describe('TransactionStatus Component', function () {
  before(function () {
    sinon.stub(i18nHook, 'useI18nContext').returns((str) => str.toUpperCase());
  });

  it('should render CONFIRMED properly', function () {
    const wrapper = mount(
      <TransactionStatus status="confirmed" date="June 1" />,
    );

    assert.ok(wrapper);
    assert.strictEqual(wrapper.text(), 'June 1');
  });

  it('should render PENDING properly when status is APPROVED', function () {
    const wrapper = mount(
      <TransactionStatus
        status="approved"
        isEarliestNonce
        error={{ message: 'test-title' }}
      />,
    );

    assert.ok(wrapper);
    assert.strictEqual(wrapper.text(), 'PENDING');
    assert.strictEqual(wrapper.find(Tooltip).props().title, 'test-title');
  });

  it('should render PENDING properly', function () {
    const wrapper = mount(
      <TransactionStatus date="June 1" status="submitted" isEarliestNonce />,
    );

    assert.ok(wrapper);
    assert.strictEqual(wrapper.text(), 'PENDING');
  });

  it('should render QUEUED properly', function () {
    const wrapper = mount(<TransactionStatus status="queued" />);

    assert.ok(wrapper);
    assert.ok(
      wrapper.find('.transaction-status--queued').length,
      'queued className not found',
    );
    assert.strictEqual(wrapper.text(), 'QUEUED');
  });

  it('should render UNAPPROVED properly', function () {
    const wrapper = mount(<TransactionStatus status="unapproved" />);

    assert.ok(wrapper);
    assert.ok(
      wrapper.find('.transaction-status--unapproved').length,
      'unapproved className not found',
    );
    assert.strictEqual(wrapper.text(), 'UNAPPROVED');
  });

  after(function () {
    sinon.restore();
  });
});
