import React from 'react';
import ConfirmationPage from '../confirmation';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../../shared/constants/app';
import { PendingApproval } from './util';

/**
 * An approval for a snap to redirect the user.<br/><br/>
 * Automatically displayed via the `ConfirmationPage` component when using the `ApprovalController.add` method with the `type` set to `showSnapAccountRedirect`.<br/><br/>
 * The below arguments are properties of the `requestData` object required by the `ApprovalController.add` method.
 */
export default {
  title: 'Pages/ConfirmationPage/SnapAccountRedirect',
  component: ConfirmationPage,
  argTypes: {
    redirectToHomeOnZeroConfirmations: {
      table: {
        disable: true,
      },
    },
    url: {
      control: 'text',
      description: 'The URL to redirect the user to.',
    },
    message: {
      control: 'text',
      description: 'The message text to display to the user.',
    },
    isBlockedUrl: {
      control: 'boolean',
      description: 'Whether or not the URL is blocked.',
      table: {
        defaultValue: { summary: false },
      },
    },
  },
  args: {
    url: 'https://consensys.com',
    message: 'This is a test message.',
    isBlockedUrl: false,
  },
};

export const DefaultStory = (args) => {
  return (
    <PendingApproval
      type={SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect}
      requestData={args}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

DefaultStory.storyName = 'Default';
