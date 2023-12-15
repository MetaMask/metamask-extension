/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import ConfirmationPage from '../confirmation';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';
import { PendingApproval } from './util';

export default {
  title: 'Pages/ConfirmationPage/snap_manageAccounts:confirmAccountRemoval',
  component: ConfirmationPage,
};

export const DefaultStory = (args) => {
  return (
    <PendingApproval
      type={SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval}
      requestData={{
        publicAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      }}
    >
      <ConfirmationPage {...args} />
    </PendingApproval>
  );
};

DefaultStory.storyName = 'Default';
