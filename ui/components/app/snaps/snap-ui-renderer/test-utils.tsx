import React from 'react';
import { DeepPartial, Reducer } from 'redux';
import { RenderResult } from '@testing-library/react';
import type { SnapId } from '@metamask/snaps-sdk';
import { JSXElement } from '@metamask/snaps-sdk/jsx';
import configureStore, { MetaMaskReduxState } from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { SnapUIRenderer } from './snap-ui-renderer';

export const MOCK_SNAP_ID = 'npm:@metamask/test-snap-bip44';
export const MOCK_INTERFACE_ID = 'interfaceId';

type RenderInterfaceOptions = {
  snapId?: SnapId;
  useFooter?: boolean;
  onCancel?: () => void;
  contentBackgroundColor?: string;
  state?: Record<string, unknown>;
  metamaskState?: DeepPartial<MetaMaskReduxState>;
};

// The return type from renderWithProvider includes RenderResult plus a history property
type RenderWithProviderResult = RenderResult & {
  history: {
    location: {
      pathname: string;
    };
  };
};

// Combine the renderWithProvider result with our custom properties
type RenderInterfaceResult = RenderWithProviderResult & {
  updateInterface: (
    newContent: JSXElement,
    newState?: Record<string, unknown> | null,
  ) => void;
  getRenderCount: () => number;
};

/**
 * Renders a Snap UI interface for testing purposes.
 *
 * @param content - The JSXElement to render.
 * @param options - The options for rendering the interface.
 * @param options.useFooter - Whether to render the footer.
 * @param options.onCancel - The function to call when the interface is cancelled.
 * @param options.contentBackgroundColor - The background color of the content.
 * @param options.state - The state of the interface.
 * @param options.metamaskState - The initial state of the MetaMask store.
 * @param options.snapId - The ID of the snap to render the interface for.
 * @returns Testing utilities with render result, plus updateInterface and getRenderCount functions.
 */
export function renderInterface(
  content: JSXElement,
  {
    useFooter = false,
    snapId = MOCK_SNAP_ID as SnapId,
    onCancel,
    contentBackgroundColor,
    state = {},
    metamaskState = {},
  }: RenderInterfaceOptions = {},
): RenderInterfaceResult {
  const store = configureStore({
    ...mockState,
    ...metamaskState,
    metamask: {
      ...mockState.metamask,
      ...metamaskState?.metamask,
      interfaces: {
        [MOCK_INTERFACE_ID]: {
          snapId,
          content,
          state,
          context: null,
          contentType: null,
        },
      },
    },
  });

  const reducer: Reducer<MetaMaskReduxState> = (reduxState, action) => {
    const storeState = reduxState ?? store.getState();

    if (action.type === 'updateInterface') {
      return {
        ...storeState,
        metamask: {
          ...storeState.metamask,
          interfaces: {
            [MOCK_INTERFACE_ID]: {
              snapId,
              content: action.content,
              state: action.state ?? reduxState,
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

  const updateInterface = (
    newContent: JSXElement,
    newState: Record<string, unknown> | null = null,
  ) => {
    store.dispatch({
      type: 'updateInterface',
      content: newContent,
      state: newState,
    });
  };

  const result = renderWithProvider(
    <SnapUIRenderer
      snapId={snapId}
      interfaceId={MOCK_INTERFACE_ID}
      useFooter={useFooter}
      onCancel={onCancel}
      contentBackgroundColor={contentBackgroundColor}
      PERF_DEBUG
    />,
    store,
  );

  const getRenderCount = () =>
    parseInt(
      result.getByTestId('performance').getAttribute('data-renders') as string,
      10,
    );

  return { ...result, updateInterface, getRenderCount };
}
