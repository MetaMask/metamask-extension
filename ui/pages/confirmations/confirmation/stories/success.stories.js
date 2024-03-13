import React from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import { isArray } from 'lodash';
import { Display } from '../../../../helpers/constants/design-system';
import { IconName } from '../../../../components/component-library';
import ConfirmationPage from '../confirmation';
import { PendingApproval } from './util';

/**
 * A standard success confirmation to be reused across confirmation flows with minimal code.<br/><br/>
 * Automatically displayed via the `ConfirmationPage` component when using the `ApprovalController.success` method.<br/><br/>
 * The below arguments are properties in the `ApprovalController.success` request.
 */
export default {
  title: 'Pages/ConfirmationPage/ResultSuccess',
  component: ConfirmationPage,
  argTypes: {
    redirectToHomeOnZeroConfirmations: {
      table: {
        disable: true,
      },
    },
    message: {
      control: 'text',
      description:
        'The message text in the center of the page under the title.<br/><br/>Also supports result component configurations.<br/>See `header` argument for example.',
      table: {
        defaultValue: { summary: 'The operation completed successfully.' },
      },
    },
    title: {
      control: 'text',
      description:
        'The title text in the center of the page.<br/>Can be hidden with `null`.',
      table: {
        defaultValue: { summary: 'Success' },
      },
    },
    icon: {
      control: 'text',
      description: 'The name of the icon.<br/>Can be hidden with `null`.',
      table: {
        defaultValue: { summary: 'confirmation' },
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
      type={ApprovalType.ResultSuccess}
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

export const CustomMessageStory = () => {
  return (
    <PendingApproval
      type={ApprovalType.ResultSuccess}
      requestData={{ message: 'Custom Message' }}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

CustomMessageStory.storyName = 'Custom Message';

export const TemplateStory = () => {
  return (
    <PendingApproval
      type={ApprovalType.ResultSuccess}
      requestData={{
        title: 'Account created',
        icon: IconName.UserCircleAdd,
        message: [
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
                    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
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
              style: {
                fontSize: '14px',
                gap: '5px',
              },
            },
            children: [
              'Your new account is ready to use.',
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
      type={ApprovalType.ResultSuccess}
      requestData={{
        message: {
          name: 'AccountListItem',
          key: 'accountListItem',
          properties: {
            identity: {
              address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
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
