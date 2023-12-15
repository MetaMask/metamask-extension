/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import ConfirmationPage from '../confirmation';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';
import { PendingApproval } from './util';

export default {
  title: 'Pages/ConfirmationPage/showSnapAccountRedirect',
  component: ConfirmationPage,
};

export const DefaultStory = (args) => {
  return (
    <PendingApproval
      type={SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect}
      requestData={{
        url: 'https://consensys.com',
        message: 'This is a test message.',
        isBlockedUrl: false,
      }}
    >
      <ConfirmationPage {...args} />
    </PendingApproval>
  );
};

DefaultStory.storyName = 'Default';
