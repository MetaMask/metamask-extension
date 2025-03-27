import { Box, Input } from '@metamask/snaps-sdk/jsx';
import { fireEvent, waitFor } from '@testing-library/react';
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

describe('SnapUIInput', () => {
  beforeEach(() => {
    jest.resetAllMocks();
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
});
