import React from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import { getJsxElementFromComponent } from '@metamask/snaps-utils';
import { button, copyable, heading, panel, text } from '@metamask/snaps-sdk';
import ConfirmationPage from '../confirmation';
import { PendingApproval } from './util';

export default {
  title: 'Pages/Confirmations/Confirmation/Stories/ConfirmationPage',
  component: ConfirmationPage,
  args: {},
};

const STATE_MOCK_DEFAULT = {
  interfaces: {
    testInterfaceId: {
      content: getJsxElementFromComponent(
        panel([
          heading('Test Heading'),
          text('Test Text'),
          copyable('Test Copyable'),
          button('Test Button'),
        ]),
      ),
      state: {},
      snapId: 'local:http://localhost:8080/',
    },
  },
};

const STATE_MOCK_SCROLL = {
  interfaces: {
    testInterfaceId: {
      content: getJsxElementFromComponent(
        panel([
          heading('Test Heading'),
          text('Test Text'),
          text('Test Text'),
          text('Test Text'),
          text('Test Text'),
          text('Test Text'),
          text('Test Text'),
          text('Test Text'),
          text('Test Text'),
          text('Test Text'),
          text('Test Text'),
          text('Test Text'),
          text('Test Text'),
          text('Test Text'),
          text('Test Text'),
          text('Test Text'),
        ]),
      ),
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
