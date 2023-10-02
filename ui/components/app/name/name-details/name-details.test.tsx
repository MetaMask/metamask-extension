import React from 'react';
import { NameType } from '@metamask/name-controller';
import configureStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useDispatch } from 'react-redux';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { setName, updateProposedNames } from '../../../../store/actions';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import NameDetails from './name-details';

jest.mock('../../../../store/actions', () => ({
  setName: jest.fn(),
  updateProposedNames: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.useFakeTimers();

const ADDRESS_NO_NAME_MOCK = '0xc0ffee254729296a45a3885639ac7e10f9d54979';
const ADDRESS_SAVED_NAME_MOCK = '0xc0ffee254729296a45a3885639ac7e10f9d54977';
const CHAIN_ID_MOCK = '0x1';
const SAVED_NAME_MOCK = 'TestName';
const SAVED_NAME_2_MOCK = 'TestName2';
const SOURCE_ID_MOCK = 'TestSourceId1';
const SOURCE_ID_2_MOCK = 'TestSourceId2';
const PROPOSED_NAME_MOCK = 'TestProposedName';
const PROPOSED_NAME_2_MOCK = 'TestProposedName2';

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
              [SOURCE_ID_MOCK]: {
                proposedNames: [PROPOSED_NAME_MOCK],
                lastRequestTime: null,
                retryDelay: null,
              },
              [SOURCE_ID_2_MOCK]: {
                proposedNames: [PROPOSED_NAME_2_MOCK],
                lastRequestTime: null,
                retryDelay: null,
              },
            },
            name: SAVED_NAME_MOCK,
            sourceId: SOURCE_ID_MOCK,
          },
        },
        [ADDRESS_NO_NAME_MOCK]: {
          [CHAIN_ID_MOCK]: {
            proposedNames: {
              [SOURCE_ID_MOCK]: {
                proposedNames: [PROPOSED_NAME_MOCK],
                lastRequestTime: null,
                retryDelay: null,
              },
              [SOURCE_ID_2_MOCK]: {
                proposedNames: [PROPOSED_NAME_2_MOCK],
                lastRequestTime: null,
                retryDelay: null,
              },
            },
            name: null,
          },
        },
      },
    },
  },
};

async function saveName(
  component: ReturnType<typeof renderWithProvider>,
  sourceId: string | null,
  name: string | null,
  hasName: boolean,
) {
  const { getByPlaceholderText, getByText } = component;
  const nameInput = getByPlaceholderText('Set a personal display name...');
  const saveButton = getByText(hasName ? 'Ok' : 'Save', { exact: false });

  await act(async () => {
    fireEvent.click(nameInput);
  });

  if (sourceId) {
    const providerOption = getByText(sourceId);

    await act(async () => {
      fireEvent.click(providerOption);
    });
  }

  if (name !== null) {
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: name } });
    });
  }

  await act(async () => {
    fireEvent.click(saveButton);
  });
}

describe('NameDetails', () => {
  const store = configureStore()(STATE_MOCK);
  const setNameMock = jest.mocked(setName);
  const updateProposedNamesMock = jest.mocked(updateProposedNames);
  const useDispatchMock = jest.mocked(useDispatch);

  beforeEach(() => {
    jest.resetAllMocks();
    useDispatchMock.mockReturnValue(jest.fn());
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

  it('renders proposed names', async () => {
    const component = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_SAVED_NAME_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    const { getByPlaceholderText, baseElement } = component;
    const nameInput = getByPlaceholderText('Set a personal display name...');

    await act(async () => {
      fireEvent.click(nameInput);
    });

    expect(baseElement).toMatchSnapshot();
  });

  it('saves current name on save button click', async () => {
    const component = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_NAME_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    await saveName(component, null, SAVED_NAME_MOCK, false);

    expect(setNameMock).toHaveBeenCalledTimes(1);
    expect(setNameMock).toHaveBeenCalledWith({
      value: ADDRESS_NO_NAME_MOCK,
      type: NameType.ETHEREUM_ADDRESS,
      name: SAVED_NAME_MOCK,
      sourceId: undefined,
      variation: CHAIN_ID_MOCK,
    });
  });

  it('saves selected source on save button click', async () => {
    const component = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_NAME_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    await saveName(component, SOURCE_ID_MOCK, null, false);

    expect(setNameMock).toHaveBeenCalledTimes(1);
    expect(setNameMock).toHaveBeenCalledWith({
      value: ADDRESS_NO_NAME_MOCK,
      type: NameType.ETHEREUM_ADDRESS,
      name: PROPOSED_NAME_MOCK,
      sourceId: SOURCE_ID_MOCK,
      variation: CHAIN_ID_MOCK,
    });
  });

  it('clears current name on save button click if name is empty', async () => {
    const component = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_SAVED_NAME_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    await saveName(component, null, '', true);

    expect(setNameMock).toHaveBeenCalledTimes(1);
    expect(setNameMock).toHaveBeenCalledWith({
      value: ADDRESS_SAVED_NAME_MOCK,
      type: NameType.ETHEREUM_ADDRESS,
      name: null,
      sourceId: undefined,
      variation: CHAIN_ID_MOCK,
    });
  });

  it('clears selected source when name changed', async () => {
    const component = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_SAVED_NAME_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    await saveName(component, null, SAVED_NAME_2_MOCK, true);

    expect(setNameMock).toHaveBeenCalledTimes(1);
    expect(setNameMock).toHaveBeenCalledWith({
      value: ADDRESS_SAVED_NAME_MOCK,
      type: NameType.ETHEREUM_ADDRESS,
      name: SAVED_NAME_2_MOCK,
      sourceId: undefined,
      variation: CHAIN_ID_MOCK,
    });
  });

  it('updates proposed names', () => {
    renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_NAME_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    expect(updateProposedNamesMock).toHaveBeenCalledTimes(1);
    expect(updateProposedNamesMock).toHaveBeenCalledWith({
      value: ADDRESS_NO_NAME_MOCK,
      type: NameType.ETHEREUM_ADDRESS,
      onlyUpdateAfterDelay: true,
      variation: CHAIN_ID_MOCK,
    });
  });

  it('updates proposed names on regular interval', () => {
    renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_NAME_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    expect(updateProposedNamesMock).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1999);
    expect(updateProposedNamesMock).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1);
    expect(updateProposedNamesMock).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(2000);
    expect(updateProposedNamesMock).toHaveBeenCalledTimes(3);
  });

  describe('metrics', () => {
    it('sends open modal event', async () => {
      const trackEventMock = jest.fn();

      useDispatchMock.mockReturnValue(
        jest.fn().mockResolvedValue({
          results: {
            [SOURCE_ID_MOCK]: {
              proposedNames: [PROPOSED_NAME_MOCK],
            },
            [SOURCE_ID_2_MOCK]: {
              proposedNames: [PROPOSED_NAME_2_MOCK],
            },
          },
        }),
      );

      await act(async () => {
        renderWithProvider(
          <MetaMetricsContext.Provider value={trackEventMock}>
            <NameDetails
              type={NameType.ETHEREUM_ADDRESS}
              value={ADDRESS_SAVED_NAME_MOCK}
              onClose={() => undefined}
            />
          </MetaMetricsContext.Provider>,
          store,
        );
      });

      expect(trackEventMock).toHaveBeenCalledWith({
        event: MetaMetricsEventName.PetnameModalOpened,
        category: MetaMetricsEventCategory.Petnames,
        properties: {
          has_petname: true,
          petname_category: NameType.ETHEREUM_ADDRESS,
          suggested_names_sources: [SOURCE_ID_MOCK, SOURCE_ID_2_MOCK],
        },
      });
    });

    it('sends created event', async () => {
      const trackEventMock = jest.fn();

      const component = renderWithProvider(
        <MetaMetricsContext.Provider value={trackEventMock}>
          <NameDetails
            type={NameType.ETHEREUM_ADDRESS}
            value={ADDRESS_NO_NAME_MOCK}
            onClose={() => undefined}
          />
        </MetaMetricsContext.Provider>,
        store,
      );

      await saveName(component, SOURCE_ID_MOCK, null, false);

      expect(trackEventMock).toHaveBeenCalledWith({
        event: MetaMetricsEventName.PetnameCreated,
        category: MetaMetricsEventCategory.Petnames,
        properties: {
          petname_category: NameType.ETHEREUM_ADDRESS,
          suggested_names_sources: [SOURCE_ID_MOCK, SOURCE_ID_2_MOCK],
          petname_source: SOURCE_ID_MOCK,
        },
      });
    });

    it('sends updated event', async () => {
      const trackEventMock = jest.fn();

      const component = renderWithProvider(
        <MetaMetricsContext.Provider value={trackEventMock}>
          <NameDetails
            type={NameType.ETHEREUM_ADDRESS}
            value={ADDRESS_SAVED_NAME_MOCK}
            onClose={() => undefined}
          />
        </MetaMetricsContext.Provider>,
        store,
      );

      await saveName(component, SOURCE_ID_2_MOCK, null, true);

      expect(trackEventMock).toHaveBeenCalledWith({
        event: MetaMetricsEventName.PetnameUpdated,
        category: MetaMetricsEventCategory.Petnames,
        properties: {
          petname_category: NameType.ETHEREUM_ADDRESS,
          suggested_names_sources: [SOURCE_ID_MOCK, SOURCE_ID_2_MOCK],
          petname_source: SOURCE_ID_2_MOCK,
          petname_previous_source: SOURCE_ID_MOCK,
        },
      });
    });

    it('sends deleted event', async () => {
      const trackEventMock = jest.fn();

      const component = renderWithProvider(
        <MetaMetricsContext.Provider value={trackEventMock}>
          <NameDetails
            type={NameType.ETHEREUM_ADDRESS}
            value={ADDRESS_SAVED_NAME_MOCK}
            onClose={() => undefined}
          />
        </MetaMetricsContext.Provider>,
        store,
      );

      await saveName(component, null, '', true);

      expect(trackEventMock).toHaveBeenCalledWith({
        event: MetaMetricsEventName.PetnameDeleted,
        category: MetaMetricsEventCategory.Petnames,
        properties: {
          petname_category: NameType.ETHEREUM_ADDRESS,
          suggested_names_sources: [SOURCE_ID_MOCK, SOURCE_ID_2_MOCK],
          petname_previous_source: SOURCE_ID_MOCK,
        },
      });
    });
  });
});
