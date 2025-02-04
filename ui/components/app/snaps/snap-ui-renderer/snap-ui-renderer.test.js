import React from 'react';
import {
  Box,
  Text,
  Container,
  Footer,
  Button,
  Input,
} from '@metamask/snaps-sdk/jsx';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import * as backgroundConnection from '../../../../store/background-connection';
import { BackgroundColor } from '../../../../helpers/constants/design-system';
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
  } = {},
) {
  const mockStore = configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      interfaces: {
        [MOCK_INTERFACE_ID]: {
          snapId: MOCK_SNAP_ID,
          content,
          state: {},
          context: null,
          contentType: null,
        },
      },
    },
  });
  return renderWithProvider(
    <SnapUIRenderer
      snapId={MOCK_SNAP_ID}
      interfaceId={MOCK_INTERFACE_ID}
      useDelineator={useDelineator}
      useFooter={useFooter}
      onCancel={onCancel}
      contentBackgroundColor={contentBackgroundColor}
    />,
    mockStore,
  );
}

describe('SnapUIRenderer', () => {
  it('renders loading state', () => {
    const { container } = renderInterface(null);

    expect(container.getElementsByClassName('pulse-loader')).toHaveLength(1);
    expect(container).toMatchSnapshot();
  });

  it('renders basic UI', () => {
    const { container, getByText } = renderInterface(
      Box({ children: Text({ children: 'Hello world!' }) }),
    );

    expect(getByText('Hello world!')).toBeDefined();
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
        'mm-box--background-color-background-alternative',
      ),
    ).toHaveLength(1);
    expect(container).toMatchSnapshot();
  });

  it('supports interactive inputs', () => {
    const { container, getByRole } = renderInterface(
      Container({
        children: [
          Box({ children: Input({ name: 'input' }) }),
          Footer({ children: Button({ children: 'Foo' }) }),
        ],
      }),
      { useFooter: true },
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
});
