import * as React from 'react';
import { NameType } from '@metamask/name-controller';
import configureStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { setName } from '../../../../store/actions';
import NameDetails from './name-details';

jest.mock('../../../../store/actions', () => ({
  setName: jest.fn(),
  updateProposedNames: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

const ADDRESS_NO_NAME_MOCK = '0xc0ffee254729296a45a3885639AC7E10F9d54979';
const ADDRESS_SAVED_NAME_MOCK = '0xc0ffee254729296a45a3885639AC7E10F9d54977';
const CHAIN_ID_MOCK = '0x1';
const SAVED_NAME_MOCK = 'TestName';
const SAVED_NAME_2_MOCK = 'TestName2';
const SOURCE_ID_MOCK = 'TestSourceId';
const SOURCE_ID_2_MOCK = 'TestSourceId2';
const PROPOSED_NAME_MOCK = 'TestProposedName';
const PROPOSED_NAME_2_MOCK = 'TestProposedName2';
const PROPOSED_NAME_3_MOCK = 'TestProposedName3';

const STATE_MOCK = {
  metamask: {
    providerConfig: {
      chainId: CHAIN_ID_MOCK,
    },
    names: {
      [NameType.ETHEREUM_ADDRESS]: {
        [ADDRESS_SAVED_NAME_MOCK]: {
          [CHAIN_ID_MOCK]: {
            proposedNames: {
              [SOURCE_ID_MOCK]: [PROPOSED_NAME_MOCK, PROPOSED_NAME_2_MOCK],
              [SOURCE_ID_2_MOCK]: [PROPOSED_NAME_3_MOCK],
            },
            name: SAVED_NAME_MOCK,
            sourceId: SOURCE_ID_MOCK,
          },
        },
        [ADDRESS_NO_NAME_MOCK]: {
          [CHAIN_ID_MOCK]: {
            proposedNames: {
              [SOURCE_ID_MOCK]: [PROPOSED_NAME_MOCK, PROPOSED_NAME_2_MOCK],
              [SOURCE_ID_2_MOCK]: [PROPOSED_NAME_3_MOCK],
            },
            name: null,
          },
        },
      },
    },
  },
};

describe('NameDetails', () => {
  const store = configureStore()(STATE_MOCK);
  const setNameMock = jest.mocked(setName);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders with no saved name', () => {
    const { baseElement } = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_NAME_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('renders with saved name', () => {
    const { baseElement } = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_SAVED_NAME_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('saves current name on save button click', async () => {
    const { getByPlaceholderText, getByText } = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_NAME_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    const nameInput = getByPlaceholderText('Set a personal display name...');
    const saveButton = getByText('Save', { exact: false });

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: SAVED_NAME_MOCK } });
    });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(setNameMock).toHaveBeenCalledTimes(1);
    expect(setNameMock).toHaveBeenCalledWith({
      value: ADDRESS_NO_NAME_MOCK,
      type: NameType.ETHEREUM_ADDRESS,
      name: SAVED_NAME_MOCK,
      sourceId: undefined,
    });
  });

  it('saves selected source on save button click', async () => {
    const { getByPlaceholderText, getByText } = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_NAME_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    const nameInput = getByPlaceholderText('Set a personal display name...');
    const saveButton = getByText('Save', { exact: false });

    await act(async () => {
      fireEvent.click(nameInput);
    });

    const providerOption = getByText(PROPOSED_NAME_MOCK);

    await act(async () => {
      fireEvent.click(providerOption);
    });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(setNameMock).toHaveBeenCalledTimes(1);
    expect(setNameMock).toHaveBeenCalledWith({
      value: ADDRESS_NO_NAME_MOCK,
      type: NameType.ETHEREUM_ADDRESS,
      name: PROPOSED_NAME_MOCK,
      sourceId: SOURCE_ID_MOCK,
    });
  });

  it('clears current name on save button click if name is empty', async () => {
    const { getByPlaceholderText, getByText } = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_SAVED_NAME_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    const nameInput = getByPlaceholderText('Set a personal display name...');
    const saveButton = getByText('Ok');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: '' } });
    });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(setNameMock).toHaveBeenCalledTimes(1);
    expect(setNameMock).toHaveBeenCalledWith({
      value: ADDRESS_SAVED_NAME_MOCK,
      type: NameType.ETHEREUM_ADDRESS,
      name: '',
      sourceId: undefined,
    });
  });

  it('clears selected source when name changed', async () => {
    const { getByPlaceholderText, getByText } = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_SAVED_NAME_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    const nameInput = getByPlaceholderText('Set a personal display name...');
    const saveButton = getByText('Ok');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: SAVED_NAME_2_MOCK } });
    });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(setNameMock).toHaveBeenCalledTimes(1);
    expect(setNameMock).toHaveBeenCalledWith({
      value: ADDRESS_SAVED_NAME_MOCK,
      type: NameType.ETHEREUM_ADDRESS,
      name: SAVED_NAME_2_MOCK,
      sourceId: undefined,
    });
  });
});
