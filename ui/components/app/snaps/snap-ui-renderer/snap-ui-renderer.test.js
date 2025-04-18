import {
  Box,
  Text,
  Container,
  Footer,
  Button,
  Input,
} from '@metamask/snaps-sdk/jsx';
import { fireEvent, waitFor } from '@testing-library/react';
import { BackgroundColor } from '../../../../helpers/constants/design-system';
import * as backgroundConnection from '../../../../store/background-connection';
import { renderInterface, MOCK_INTERFACE_ID, MOCK_SNAP_ID } from './test-utils';

jest.mock('../../../../store/background-connection', () => ({
  ...jest.requireActual('../../../../store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

const { submitRequestToBackground } = jest.mocked(backgroundConnection);

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
          origin: 'metamask',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
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
});
