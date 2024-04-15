import React from 'react';
import ConfirmationPage from '../confirmation';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../../shared/constants/app';
import { PendingApproval } from './util';

/**
 * An approval to remove a snap account.<br/><br/>
 * Automatically displayed via the `ConfirmationPage` component when using the `ApprovalController.add` method with the `type` set to `snap_manageAccounts:confirmAccountRemoval`.<br/><br/>
 * The below arguments are properties of the `requestData` object required by the `ApprovalController.add` method.
 */
export default {
  title: 'Pages/ConfirmationPage/RemoveSnapAccount',
  component: ConfirmationPage,
  argTypes: {
    redirectToHomeOnZeroConfirmations: {
      table: {
        disable: true,
      },
    },
    publicAddress: {
      control: 'text',
      description: 'The public address of the account to be removed.',
    },
  },
  args: {
    publicAddress: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
  },
};

export const DefaultStory = (args) => {
  return (
    <PendingApproval
      type={SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval}
      requestData={args}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

DefaultStory.storyName = 'Default';
