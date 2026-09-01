import React from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import ConfirmationPage from '../confirmation';
import { PendingApproval } from './util';

export default {
  title: 'Pages/ConfirmationPage/SnapDialog',
  component: ConfirmationPage,
  args: {},
};

const STATE_MOCK_DEFAULT = {
  interfaces: {
    testInterfaceId: {
      content: {
        type: 'Box',
        props: {
          children: [
            { type: 'Heading', props: { children: 'Test Heading' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
            { type: 'Copyable', props: { value: 'Test Copyable' }, key: null },
            { type: 'Button', props: { children: 'Test Button' }, key: null },
          ],
        },
        key: null,
      },
      state: {},
      snapId: 'local:http://localhost:8080/',
    },
  },
};

const STATE_MOCK_SCROLL = {
  interfaces: {
    testInterfaceId: {
      content: {
        type: 'Box',
        props: {
          children: [
            { type: 'Heading', props: { children: 'Test Heading' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
            { type: 'Text', props: { children: 'Test Text' }, key: null },
          ],
        },
        key: null,
      },
      state: {},
      snapId: 'local:http://localhost:8080/',
    },
  },
};

const STATE_MOCK_NAVIGATION = {
  ...STATE_MOCK_DEFAULT,
  pendingApprovals: {
    testId: {
      id: 'testId',
      origin: 'npm:@test/test-snap',
    },
    testId2: {
      id: 'testId2',
      type: ApprovalType.Transaction,
    },
    testId3: {
      id: 'testId3',
      type: ApprovalType.Transaction,
    },
  },
};

export const DefaultStory = () => {
  return (
    <PendingApproval
      type={ApprovalType.SnapDialogDefault}
      requestData={{ id: 'testInterfaceId' }}
      state={STATE_MOCK_DEFAULT}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

DefaultStory.storyName = 'Default';

export const ScrollStory = () => {
  return (
    <PendingApproval
      type={ApprovalType.SnapDialogDefault}
      requestData={{ id: 'testInterfaceId' }}
      state={STATE_MOCK_SCROLL}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

ScrollStory.storyName = 'Scrolling';

export const NavigationStory = () => {
  return (
    <PendingApproval
      type={ApprovalType.SnapDialogDefault}
      requestData={{ id: 'testInterfaceId' }}
      state={STATE_MOCK_NAVIGATION}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

NavigationStory.storyName = 'Navigation';
