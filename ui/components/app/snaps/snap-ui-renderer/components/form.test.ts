import {
  Box,
  Form,
  Input,
  Button,
  Field,
  Checkbox,
} from '@metamask/snaps-sdk/jsx';
import { fireEvent } from '@testing-library/react';
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

describe('SnapUIForm', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('will render', () => {
    const { container, getByRole } = renderInterface(
      Box({
        children: Form({
          name: 'form',
          children: [
            Input({ name: 'input' }),
            Button({ type: 'submit', name: 'submit', children: 'Submit' }),
          ],
        }),
      }),
    );

    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(submitRequestToBackground).toHaveBeenNthCalledWith(
      1,
      'updateInterfaceState',
      [MOCK_INTERFACE_ID, { form: { input: 'abc' } }],
    );

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
              event: { name: 'input', type: 'InputChangeEvent', value: 'abc' },
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
      3,
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
      4,
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
                  input: 'abc',
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

  it('will render with fields', () => {
    const { container, getByRole } = renderInterface(
      Box({
        children: Form({
          name: 'form',
          children: [
            Field({ label: 'My Input', children: Input({ name: 'input' }) }),
            Field({
              label: 'Checkbox',
              children: Checkbox({ name: 'checkbox' }),
            }),
            Button({ type: 'submit', name: 'submit', children: 'Submit' }),
          ],
        }),
      }),
    );

    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(submitRequestToBackground).toHaveBeenNthCalledWith(
      1,
      'updateInterfaceState',
      [MOCK_INTERFACE_ID, { form: { input: 'abc' } }],
    );

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
              event: { name: 'input', type: 'InputChangeEvent', value: 'abc' },
              id: MOCK_INTERFACE_ID,
            },
          },
          snapId: MOCK_SNAP_ID,
        },
      ],
    );

    const checkbox = getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(submitRequestToBackground).toHaveBeenNthCalledWith(
      3,
      'updateInterfaceState',
      [MOCK_INTERFACE_ID, { form: { checkbox: true, input: 'abc' } }],
    );

    expect(submitRequestToBackground).toHaveBeenNthCalledWith(
      4,
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
                name: 'checkbox',
                type: 'InputChangeEvent',
                value: true,
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
                  checkbox: true,
                  input: 'abc',
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
