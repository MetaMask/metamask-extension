import React from 'react';
import { DragDropContextProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import ConfirmSeedPhrase from './confirm-seed-phrase';

jest.mock('../../../store/actions.js', () => ({
  setSeedPhraseBackedUp: () => jest.fn().mockResolvedValue(),
}));

const seedPhrase = '鼠 牛 虎 兔 龍 蛇 馬 羊 猴 雞 狗 豬';

function shallowRender(props = {}) {
  const mockState = {};
  const mockStore = configureMockStore([thunk])(mockState);

  return renderWithProvider(
    <DragDropContextProvider backend={HTML5Backend}>
      <ConfirmSeedPhrase {...props} />
    </DragDropContextProvider>,
    mockStore,
  );
}

describe('ConfirmSeedPhrase Component', () => {
  it('should render correctly', () => {
    const { queryAllByTestId } = shallowRender({
      seedPhrase,
    });

    // Regex ommitted the empty/undefined draggable boxes
    expect(queryAllByTestId(/draggable-seed-(?!.*undefined)/u)).toHaveLength(
      12,
    );

    // For 24 word mnemonic phrases.
    expect(queryAllByTestId(/draggable-seed-undefined/u)).toHaveLength(24);
  });

  it('should submit correctly', async () => {
    const originalSeed = [
      '鼠',
      '牛',
      '虎',
      '兔',
      '龍',
      '蛇',
      '馬',
      '羊',
      '猴',
      '雞',
      '狗',
      '豬',
    ];

    const history = {
      replace: jest.fn(),
    };

    const { queryByTestId } = shallowRender({
      seedPhrase,
      history,
    });

    originalSeed.forEach((seed) => {
      fireEvent.click(queryByTestId(`draggable-seed-${seed}`));
    });

    const confirmSeedPhrase = queryByTestId('confirm-dragged-seed-phrase');
    fireEvent.click(confirmSeedPhrase);

    await waitFor(() => {
      expect(history.replace).toHaveBeenCalledWith('/initialize/end-of-flow');
    });
  });
});
