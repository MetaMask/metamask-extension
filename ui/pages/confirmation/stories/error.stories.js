/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { IconName } from '../../../components/component-library';
import ConfirmationPage from '../confirmation';
import { PendingApproval } from './util';

export default {
  title: 'Pages/ConfirmationPage/result_error',
  component: ConfirmationPage,
};

export const DefaultStory = (args) => {
  return (
    <PendingApproval type={ApprovalType.ResultError} requestData={{}}>
      <ConfirmationPage {...args} />
    </PendingApproval>
  );
};

DefaultStory.storyName = 'Default';

export const CustomErrorStory = (args) => {
  return (
    <PendingApproval
      type={ApprovalType.ResultError}
      requestData={{ error: 'Custom Error' }}
    >
      <ConfirmationPage {...args} />
    </PendingApproval>
  );
};

CustomErrorStory.storyName = 'Custom Error';

export const TemplateStory = (args) => {
  return (
    <PendingApproval
      type={ApprovalType.ResultError}
      requestData={{
        title: 'Account creation failed',
        icon: IconName.UserCircleAdd,
        error: [
          {
            name: 'Box',
            key: 'container',
            properties: {
              style: {
                minWidth: '100%',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-size-lg) var(--color-shadow-default)',
              },
            },
            children: [
              {
                name: 'AccountListItem',
                key: 'accountListItem',
                properties: {
                  identity: {
                    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
                    balance: '0xFFFFFFFFFFFFFFFFFF',
                    name: 'Test Account',
                  },
                },
              },
            ],
          },
          {
            name: 'Box',
            key: 'description',
            properties: {
              display: Display.Flex,
              flexDirection: FlexDirection.Column,
              style: {
                fontSize: '14px',
                gap: '5px',
              },
            },
            children: [
              'Your new account could not be created.',
              {
                name: 'a',
                key: 'link',
                properties: {
                  href: 'https://consensys.com',
                  target: '__blank',
                },
                children: 'Learn more',
              },
            ],
          },
        ],
        header: [
          {
            name: 'SnapAuthorshipHeader',
            key: 'snapHeader',
            properties: { snapId: 'npm:@test/test-snap' },
          },
        ],
      }}
    >
      <ConfirmationPage {...args} />
    </PendingApproval>
  );
};

TemplateStory.storyName = 'Templates + Custom Icon + Custom Title';

export const TemplateOnlyStory = (args) => {
  return (
    <PendingApproval
      type={ApprovalType.ResultError}
      requestData={{
        error: {
          name: 'AccountListItem',
          key: 'accountListItem',
          properties: {
            identity: {
              address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
              balance: '0xFFFFFFFFFFFFFFFFFF',
              name: 'Test Account',
            },
          },
        },
        icon: null,
        title: null,
      }}
    >
      <ConfirmationPage {...args} />
    </PendingApproval>
  );
};

TemplateOnlyStory.storyName = 'Template Only';
