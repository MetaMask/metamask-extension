import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../../store/store';
import mockState from '../../../../test/data/mock-state.json';

export const MOCK_SNAP_ID = 'npm:@metamask/test-snap-bip44';
export const MOCK_INTERFACE_ID = 'interfaceId';

export function createSnapInterfaceRenderer(
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

  const renderResult = renderWithProvider(
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
      renderResult.getByTestId('performance').getAttribute('data-renders'),
      10,
    );

  return { ...renderResult, updateInterface, getRenderCount };
}