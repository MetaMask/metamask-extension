import { Box, Form, Field, FileInput, Button } from '@metamask/snaps-sdk/jsx';
import { fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as backgroundConnection from '../../../../../store/background-connection';
import {
  MOCK_INTERFACE_ID,
  MOCK_SNAP_ID,
  renderInterface,
} from '../test-utils';

jest.mock('../../../../../store/background-connection', () => ({
  ...jest.requireActual('../../../../../store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

const { submitRequestToBackground } = jest.mocked(backgroundConnection);

describe('SnapUIFileInput', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders and emits events when used', async () => {
    const { container, getByRole } = renderInterface(
      Box({
        children: Form({
          name: 'form',
          children: [
            Field({
              label: 'My Input',
              children: FileInput({ name: 'input' }),
            }),
            Button({ type: 'submit', name: 'submit', children: 'Submit' }),
          ],
        }),
      }),
    );

    const file = new File(['foo'], 'foo.svg', { type: 'image/svg' });

    // JSDOM doesn't support array buffer so we overwrite it
    file.arrayBuffer = async () => {
      return [102, 111, 111] as unknown as ArrayBuffer;
    };

    const input = container.querySelector('#input') as HTMLInputElement;
    expect(input).toBeDefined();
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(submitRequestToBackground).toHaveBeenNthCalledWith(
        1,
        'updateInterfaceState',
        [
          MOCK_INTERFACE_ID,
          {
            form: {
              input: {
                contentType: 'image/svg',
                contents: 'Zm9v',
                name: 'foo.svg',
                size: 3,
              },
            },
          },
        ],
      );
    });

    expect(submitRequestToBackground).toHaveBeenNthCalledWith(
      2,
      'handleSnapRequest',
      [
        {
          handler: 'onUserInput',
          origin: 'metamask',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              event: {
                name: 'input',
                type: 'FileUploadEvent',
                file: {
                  contentType: 'image/svg',
                  contents: 'Zm9v',
                  name: 'foo.svg',
                  size: 3,
                },
              },
              id: MOCK_INTERFACE_ID,
            },
          },
          snapId: MOCK_SNAP_ID,
        },
      ],
    );

    const button = getByRole('button');
    fireEvent.click(button);

    expect(submitRequestToBackground).toHaveBeenNthCalledWith(
      5,
      'handleSnapRequest',
      [
        {
          handler: 'onUserInput',
          origin: 'metamask',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              event: { name: 'submit', type: 'ButtonClickEvent' },
              id: MOCK_INTERFACE_ID,
            },
          },
          snapId: MOCK_SNAP_ID,
        },
      ],
    );

    expect(submitRequestToBackground).toHaveBeenNthCalledWith(
      6,
      'handleSnapRequest',
      [
        {
          handler: 'onUserInput',
          origin: 'metamask',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              event: {
                name: 'form',
                type: 'FormSubmitEvent',
                value: {
                  input: {
                    contentType: 'image/svg',
                    contents: 'Zm9v',
                    name: 'foo.svg',
                    size: 3,
                  },
                },
              },
              id: MOCK_INTERFACE_ID,
            },
          },
          snapId: MOCK_SNAP_ID,
        },
      ],
    );

    expect(container).toMatchSnapshot();
  });
});
