/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import ConfirmationPage from '../confirmation';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';
import { PendingApproval } from './util';

export default {
  title: 'Pages/ConfirmationPage/snap_manageAccounts:confirmAccountCreation',
  component: ConfirmationPage,
};

export const DefaultStory = (args) => {
  return (
    <PendingApproval
      type={SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation}
      requestData={{}}
    >
      <ConfirmationPage {...args} />
    </PendingApproval>
  );
};

DefaultStory.storyName = 'Default';
