import React from 'react';
import ConfirmationPage from '../confirmation';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../../shared/constants/app';
import { PendingApproval } from './util';

/**
 * An approval to add a snap account.<br/><br/>
 * Automatically displayed via the `ConfirmationPage` component when using the `ApprovalController.add` method with the `type` set to `snap_manageAccounts:confirmAccountCreation`.
 */
export default {
  title: 'Pages/ConfirmationPage/CreateSnapAccount',
  component: ConfirmationPage,
  argTypes: {
    redirectToHomeOnZeroConfirmations: {
      table: {
        disable: true,
      },
    },
  },
};

export const DefaultStory = () => {
  return (
    <PendingApproval
      type={SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation}
      requestData={{}}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

DefaultStory.storyName = 'Default';
