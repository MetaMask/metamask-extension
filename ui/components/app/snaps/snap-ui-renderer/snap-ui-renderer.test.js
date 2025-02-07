import React from 'react';
import {
  Box,
  Text,
  Container,
  Footer,
  Button,
  Input,
  Form,
  Field,
  Checkbox,
  FileInput,
} from '@metamask/snaps-sdk/jsx';
import { fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import * as backgroundConnection from '../../../../store/background-connection';
import { BackgroundColor } from '../../../../helpers/constants/design-system';
import configureStore from '../../../../store/store';
import { SnapUIRenderer } from './snap-ui-renderer';

jest.mock('../../../../store/background-connection', () => ({
  ...jest.requireActual('../../../../store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

const { submitRequestToBackground } = jest.mocked(backgroundConnection);

const MOCK_SNAP_ID = 'npm:@metamask/test-snap-bip44';
const MOCK_INTERFACE_ID = 'interfaceId';

function renderInterface(
  content,
  {
    useFooter = false,
    useDelineator = false,
    onCancel,
    contentBackgroundColor,
    state = {},
  } = {},
) {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      interfaces: {
        [MOCK_INTERFACE_ID]: {
          snapId: MOCK_SNAP_ID,
          content,
          state,
          context: null,
          contentType: null,
        },
      },
    },
  });

  const reducer = (storeState, action) => {
    if (action.type === 'updateInterface') {
      return {
        ...storeState,
        metamask: {
          ...storeState.metamask,
          interfaces: {
            [MOCK_INTERFACE_ID]: {
              snapId: MOCK_SNAP_ID,
              content: action.content,
              state: action.state ?? state,
              context: null,
              contentType: null,
            },
          },
        },
      };
    }
    return storeState;
  };

  store.replaceReducer(reducer);

  const updateInterface = (newContent, newState = null) => {
    store.dispatch({
      type: 'updateInterface',
      content: newContent,
      state: newState,
    });
  };

  const result = renderWithProvider(
    <SnapUIRenderer
      snapId={MOCK_SNAP_ID}
      interfaceId={MOCK_INTERFACE_ID}
      useDelineator={useDelineator}
      useFooter={useFooter}
      onCancel={onCancel}
      contentBackgroundColor={contentBackgroundColor}
      PERF_DEBUG
    />,
    store,
  );

  const getRenderCount = () =>
    parseInt(
      result.getByTestId('performance').getAttribute('data-renders'),
      10,
    );

  return { ...result, updateInterface, getRenderCount };
}

describe('SnapUIRenderer', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders loading state', () => {
    const { container } = renderInterface(null);

    expect(container.getElementsByClassName('pulse-loader')).toHaveLength(1);
    expect(container).toMatchSnapshot();
  });

  it('renders basic UI', () => {
    const { container, getByText, getRenderCount } = renderInterface(
      Box({ children: Text({ children: 'Hello world!' }) }),
    );

    expect(getByText('Hello world!')).toBeDefined();
    expect(getRenderCount()).toBe(1);
    expect(container).toMatchSnapshot();
  });

  it('renders footers', () => {
    const { container, getByText } = renderInterface(
      Container({
        children: [
          Box({ children: Text({ children: 'Hello world!' }) }),
          Footer({ children: Button({ children: 'Foo' }) }),
        ],
      }),
      { useFooter: true },
    );

    expect(getByText('Foo')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('supports the onCancel prop', () => {
    const onCancel = jest.fn();
    const { container, getByText } = renderInterface(
      Container({
        children: [
          Box({ children: Text({ children: 'Hello world!' }) }),
          Footer({ children: Button({ children: 'Foo' }) }),
        ],
      }),
      { useFooter: true, onCancel },
    );

    const button = getByText('Cancel');
    expect(button).toBeDefined();
    expect(container).toMatchSnapshot();

    fireEvent.click(button);
    expect(onCancel).toHaveBeenCalled();
  });

  it('supports the contentBackgroundColor prop', () => {
    const { container } = renderInterface(
      Container({
        children: [
          Box({ children: Text({ children: 'Hello world!' }) }),
          Footer({ children: Button({ children: 'Foo' }) }),
        ],
      }),
      {
        useFooter: true,
        contentBackgroundColor: BackgroundColor.backgroundDefault,
      },
    );

    expect(
      container.getElementsByClassName(
        'mm-box--background-color-background-default',
      ),
    ).toHaveLength(1);
    expect(container).toMatchSnapshot();
  });

  it('supports container backgrounds', () => {
    const { container } = renderInterface(
      Container({
        backgroundColor: 'alternative',
        children: [
          Box({ children: Text({ children: 'Hello world!' }) }),
          Footer({ children: Button({ children: 'Foo' }) }),
        ],
      }),
      {
        useFooter: true,
      },
    );

    expect(
      container.getElementsByClassName(
        'mm-box snap-ui-renderer__content mm-box--background-color-background-default',
      ),
    ).toHaveLength(1);
    expect(container).toMatchSnapshot();
  });

  it('supports interactive inputs', () => {
    const { container, getByRole } = renderInterface(
      Box({ children: Input({ name: 'input' }) }),
    );

    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a' } });

    expect(submitRequestToBackground).toHaveBeenNthCalledWith(
      1,
      'updateInterfaceState',
      [MOCK_INTERFACE_ID, { input: 'a' }],
    );

    expect(submitRequestToBackground).toHaveBeenNthCalledWith(
      2,
      'handleSnapRequest',
      [
        {
          handler: 'onUserInput',
          origin: '',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              context: null,
              event: { name: 'input', type: 'InputChangeEvent', value: 'a' },
              id: MOCK_INTERFACE_ID,
            },
          },
          snapId: MOCK_SNAP_ID,
        },
      ],
    );

    expect(container).toMatchSnapshot();
  });

  it('prefills interactive inputs with existing state', () => {
    const { container, getByRole } = renderInterface(
      Box({ children: Input({ name: 'input' }) }),
      { state: { input: 'bar' } },
    );

    const input = getByRole('textbox');
    expect(input).toBeDefined();
    expect(input.value).toStrictEqual('bar');

    expect(container).toMatchSnapshot();
  });

  it('supports forms', () => {
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
          origin: '',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              context: null,
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
          origin: '',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              context: null,
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
          origin: '',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              context: null,
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

  it('supports forms with fields', () => {
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
          origin: '',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              context: null,
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
          origin: '',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              context: null,
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
          origin: '',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              context: null,
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
          origin: '',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              context: null,
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

  it('re-renders when the interface changes', () => {
    const { container, getAllByRole, updateInterface, getRenderCount } =
      renderInterface(Box({ children: Input({ name: 'input' }) }));

    const inputs = getAllByRole('textbox');
    expect(inputs).toHaveLength(1);

    updateInterface(
      Box({ children: [Input({ name: 'input' }), Input({ name: 'input2' })] }),
    );

    const inputsAfterRerender = getAllByRole('textbox');
    expect(inputsAfterRerender).toHaveLength(2);

    expect(getRenderCount()).toBe(2);

    expect(container).toMatchSnapshot();
  });

  it('re-syncs state when the interface changes', () => {
    const { container, getAllByRole, getRenderCount, updateInterface } =
      renderInterface(Box({ children: Input({ name: 'input' }) }));

    updateInterface(
      Box({ children: [Input({ name: 'input' }), Input({ name: 'input2' })] }),
      { input: 'bar', input2: 'foo' },
    );

    const inputsAfterRerender = getAllByRole('textbox');
    expect(inputsAfterRerender[0].value).toStrictEqual('bar');
    expect(inputsAfterRerender[1].value).toStrictEqual('foo');

    expect(getRenderCount()).toBe(2);

    expect(container).toMatchSnapshot();
  });

  it('re-focuses input after re-render', async () => {
    const {
      container,
      getAllByRole,
      getByRole,
      updateInterface,
      getRenderCount,
    } = renderInterface(Box({ children: Input({ name: 'input' }) }));

    const input = getByRole('textbox');
    input.focus();
    expect(input).toHaveFocus();

    updateInterface(
      Box({ children: [Input({ name: 'input' }), Input({ name: 'input2' })] }),
    );

    const inputs = getAllByRole('textbox');
    expect(inputs).toHaveLength(2);

    await waitFor(() => expect(inputs[0]).toHaveFocus());

    expect(getRenderCount()).toBe(2);

    expect(container).toMatchSnapshot();
  });

  it('supports file inputs', async () => {
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
      return new Uint8Array([102, 111, 111]);
    };

    const input = container.querySelector('#input');
    await userEvent.upload(input, file);

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

    expect(submitRequestToBackground).toHaveBeenNthCalledWith(
      2,
      'handleSnapRequest',
      [
        {
          handler: 'onUserInput',
          origin: '',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              context: null,
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
          origin: '',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              context: null,
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
          origin: '',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              context: null,
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
