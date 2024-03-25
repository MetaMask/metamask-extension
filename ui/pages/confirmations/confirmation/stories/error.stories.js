import React from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import { isArray } from 'lodash';
import {
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { IconName } from '../../../../components/component-library';
import ConfirmationPage from '../confirmation';
import { PendingApproval } from './util';

/**
 * A standard error confirmation to be reused across confirmation flows with minimal code.<br/><br/>
 * Automatically displayed via the `ConfirmationPage` component when using the `ApprovalController.error` method.<br/><br/>
 * The below arguments are properties in the `ApprovalController.error` request.
 */
export default {
  title: 'Pages/ConfirmationPage/ResultError',
  component: ConfirmationPage,
  argTypes: {
    redirectToHomeOnZeroConfirmations: {
      table: {
        disable: true,
      },
    },
    error: {
      control: 'text',
      description:
        'The error message text in the center of the page under the title.<br/><br/>Also supports result component configurations.<br/>See `header` argument for example.',
      table: {
        defaultValue: { summary: 'The operation failed.' },
      },
    },
    title: {
      control: 'text',
      description:
        'The title text in the center of the page.<br/>Can be hidden with `null`.',
      table: {
        defaultValue: { summary: 'Error' },
      },
    },
    icon: {
      control: 'text',
      description: 'The name of the icon.<br/>Can be hidden with `null`.',
      table: {
        defaultValue: { summary: 'warning' },
      },
    },
    header: {
      control: 'array',
      description:
        'An array of result component configurations to be rendered at the top of the page. For example: ```[{"name": "SnapAuthorshipHeader", "key": "snapHeader", "properties": { "snapId": "npm:@test/test-snap" }}]```',
      table: {
        defaultValue: {
          summary: '[]',
        },
      },
    },
    flowToEnd: {
      control: 'text',
      description:
        'The ID of an approval flow to end once this success confirmation is confirmed.',
    },
  },
  args: {},
};

export const DefaultStory = (args) => {
  return (
    <PendingApproval
      type={ApprovalType.ResultError}
      requestData={{
        ...args,
        header: isArray(args.header) ? args.header : undefined,
      }}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

DefaultStory.storyName = 'Default';

export const CustomErrorStory = () => {
  return (
    <PendingApproval
      type={ApprovalType.ResultError}
      requestData={{ error: 'Custom Error' }}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

CustomErrorStory.storyName = 'Custom Error';

export const TemplateStory = () => {
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
                    id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                    metadata: {
                      name: 'Test Account',
                      keyring: {
                        type: 'HD Key Tree',
                      },
                    },
                    options: {},
                    methods: [
                      'personal_sign',
                      'eth_sign',
                      'eth_signTransaction',
                      'eth_signTypedData_v1',
                      'eth_signTypedData_v3',
                      'eth_signTypedData_v4',
                    ],
                    type: 'eip155:eoa',
                    keyring: 'HD Key Tree',
                    label: null,
                    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
                    balance: '0xFFFFFFFFFFFFFFFFFF',
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
      <ConfirmationPage />
    </PendingApproval>
  );
};

TemplateStory.storyName = 'Templates + Custom Icon + Custom Title';

export const TemplateOnlyStory = () => {
  return (
    <PendingApproval
      type={ApprovalType.ResultError}
      requestData={{
        error: {
          name: 'AccountListItem',
          key: 'accountListItem',
          properties: {
            identity: {
              id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              metadata: {
                name: 'Test Account',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: [
                'personal_sign',
                'eth_sign',
                'eth_signTransaction',
                'eth_signTypedData_v1',
                'eth_signTypedData_v3',
                'eth_signTypedData_v4',
              ],
              type: 'eip155:eoa',
              keyring: 'HD Key Tree',
              label: null,
              address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
              balance: '0xFFFFFFFFFFFFFFFFFF',
            },
          },
        },
        icon: null,
        title: null,
      }}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

TemplateOnlyStory.storyName = 'Template Only';
