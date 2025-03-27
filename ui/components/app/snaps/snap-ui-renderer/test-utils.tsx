import React from 'react';
import { Reducer } from 'redux';
import { JSXElement } from '@metamask/snaps-sdk/jsx';
import configureStore, { MetaMaskReduxState } from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { SnapUIRenderer } from './snap-ui-renderer';

export const MOCK_SNAP_ID = 'npm:@metamask/test-snap-bip44';
export const MOCK_INTERFACE_ID = 'interfaceId';

type RenderInterfaceOptions = {
  useFooter?: boolean;
  useDelineator?: boolean;
  onCancel?: () => void;
  contentBackgroundColor?: string;
  state?: Record<string, unknown>;
};

export function renderInterface(
  content: JSXElement,
  {
    useFooter = false,
    onCancel,
    contentBackgroundColor,
    state = {},
  }: RenderInterfaceOptions = {},
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

  const reducer: Reducer<MetaMaskReduxState> = (
    storeState = store.getState(),
    action,
  ) => {
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
      snapId={MOCK_SNAP_ID}
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
