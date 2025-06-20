import { NameType } from '@metamask/name-controller';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { useDispatch, useSelector } from 'react-redux';
import configureStore from 'redux-mock-store';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { getDomainResolutions } from '../../../../ducks/domains';
import { getNames, getNameSources } from '../../../../selectors';
import { getNftContractsByAddressByChain } from '../../../../selectors/nft';
import { setName, updateProposedNames } from '../../../../store/actions';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { useDisplayName } from '../../../../hooks/useDisplayName';
import NameDetails from './name-details';

jest.mock('../../../../store/actions', () => ({
  setName: jest.fn(),
  updateProposedNames: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../../hooks/useDisplayName', () => ({
  useDisplayName: jest.fn(),
}));

jest.useFakeTimers();

const ADDRESS_NO_NAME_MOCK = '0xc0ffee254729296a45a3885639ac7e10f9d54979';
const ADDRESS_SAVED_NAME_MOCK = '0xc0ffee254729296a45a3885639ac7e10f9d54977';
const ADDRESS_RECOGNIZED_MOCK = '0x0a3bb08b3a15a19b4de82f8acfc862606fb69a2d';
const CHAIN_ID_MOCK = '0x1';
const SAVED_NAME_MOCK = 'TestName';
const SAVED_NAME_2_MOCK = 'TestName2';
const SOURCE_ID_MOCK = 'ens';
const SOURCE_ID_2_MOCK = 'some_snap';
const PROPOSED_NAME_MOCK = 'TestProposedName';
const PROPOSED_NAME_2_MOCK = 'TestProposedName2';
const VARIATION_MOCK = CHAIN_ID_MOCK;

const STATE_MOCK = {
  metamask: {
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
    nameSources: {
      [SOURCE_ID_2_MOCK]: { label: 'Super Name Resolution Snap' },
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
    useTokenDetection: true,
    tokensChainsCache: {
      [VARIATION_MOCK]: {
        data: {
          '0x0a3bb08b3a15a19b4de82f8acfc862606fb69a2d': {
            address: '0x0a3bb08b3a15a19b4de82f8acfc862606fb69a2d',
            symbol: 'IUSD',
            name: 'iZUMi Bond USD',
            iconUrl:
              'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0a3bb08b3a15a19b4de82f8acfc862606fb69a2d.png',
          },
        },
      },
    },
  },
};

async function saveNameUsingDropdown(
  component: ReturnType<typeof renderWithProvider>,
  name: string,
  placeholder: string = 'Choose a nickname...',
) {
  const { getByPlaceholderText, getByText } = component;
  const nameInput = getByPlaceholderText(placeholder);
  const saveButton = getByText('Save');

  await act(async () => {
    fireEvent.click(nameInput);
  });

  const proposedNameOption = getByText(`Maybe: ${name}`);

  await act(async () => {
    fireEvent.click(proposedNameOption);
  });

  await act(async () => {
    fireEvent.click(saveButton);
  });
}

async function saveNameUsingTextField(
  component: ReturnType<typeof renderWithProvider>,
  name: string,
  placeholder: string = 'Choose a nickname...',
) {
  const { getByPlaceholderText, getByText } = component;
  const nameInput = getByPlaceholderText(placeholder);
  const saveButton = getByText('Save');

  await act(async () => {
    fireEvent.click(nameInput);
  });

  await act(async () => {
    fireEvent.change(nameInput, { target: { value: name } });
  });

  await act(async () => {
    fireEvent.click(saveButton);
  });
}

describe('NameDetails', () => {
  const store = configureStore()(STATE_MOCK);
  const setNameMock = jest.mocked(setName);
  const updateProposedNamesMock = jest.mocked(updateProposedNames);
  const useDispatchMock = jest.mocked(useDispatch);
  const useSelectorMock = jest.mocked(useSelector);
  const useDisplayNameMock = jest.mocked(useDisplayName);

  beforeEach(() => {
    jest.resetAllMocks();
    useDispatchMock.mockReturnValue(jest.fn());

    useDisplayNameMock.mockReturnValue({
      name: null,
      hasPetname: false,
      displayState: TrustSignalDisplayState.Unknown,
    });

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getNames) {
        return {
          [NameType.ETHEREUM_ADDRESS]: {
            [ADDRESS_SAVED_NAME_MOCK]: {
              [VARIATION_MOCK]: {
                name: SAVED_NAME_MOCK,
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
              },
            },
            [ADDRESS_NO_NAME_MOCK]: {
              [VARIATION_MOCK]: {
                name: SAVED_NAME_MOCK,
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
              },
            },
          },
        };
      } else if (selector === getNftContractsByAddressByChain) {
        return {
          [VARIATION_MOCK]: {
            [ADDRESS_RECOGNIZED_MOCK]: {
              name: 'iZUMi Bond USD',
            },
          },
        };
      } else if (selector === getDomainResolutions) {
        return [
          {
            resolvedAddress: ADDRESS_SAVED_NAME_MOCK,
            domainName: 'Domain name',
          },
        ];
      } else if (selector === getNameSources) {
        return {
          [SOURCE_ID_2_MOCK]: { label: 'Super Name Resolution Snap' },
        };
      }
      return undefined;
    });
  });

  it('renders when no address value is passed', () => {
    const { baseElement } = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={''}
        variation={VARIATION_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('renders with no saved name', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getNames) {
        return {
          [NameType.ETHEREUM_ADDRESS]: {},
        };
      } else if (selector === getNftContractsByAddressByChain) {
        return {
          [VARIATION_MOCK]: {
            [ADDRESS_RECOGNIZED_MOCK]: {
              name: 'iZUMi Bond USD',
            },
          },
        };
      } else if (selector === getDomainResolutions) {
        return [
          {
            resolvedAddress: ADDRESS_SAVED_NAME_MOCK,
          },
        ];
      } else if (selector === getNameSources) {
        return {
          [SOURCE_ID_2_MOCK]: { label: 'Super Name Resolution Snap' },
        };
      }
      return undefined;
    });

    useDisplayNameMock.mockReturnValue({
      name: null,
      hasPetname: false,
      displayState: TrustSignalDisplayState.Unknown,
    });

    const { baseElement } = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_NAME_MOCK}
        variation={VARIATION_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('renders with saved name', () => {
    useDisplayNameMock.mockReturnValue({
      name: SAVED_NAME_MOCK,
      hasPetname: true,
      displayState: TrustSignalDisplayState.Petname,
    });

    const { baseElement } = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_SAVED_NAME_MOCK}
        variation={VARIATION_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('renders with recognized name', () => {
    useDisplayNameMock.mockReturnValue({
      name: 'iZUMi Bond USD',
      hasPetname: false,
      displayState: TrustSignalDisplayState.Recognized,
    });

    const { baseElement } = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_RECOGNIZED_MOCK}
        variation={VARIATION_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('renders proposed names', async () => {
    useDisplayNameMock.mockReturnValue({
      name: SAVED_NAME_MOCK,
      hasPetname: true,
      displayState: TrustSignalDisplayState.Petname,
    });

    const component = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_SAVED_NAME_MOCK}
        variation={VARIATION_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    const { getByPlaceholderText, baseElement } = component;
    const nameInput = getByPlaceholderText('Choose a nickname...');

    await act(async () => {
      fireEvent.click(nameInput);
    });

    expect(baseElement).toMatchSnapshot();
  });

  it('saves current name on save button click', async () => {
    useDisplayNameMock.mockReturnValue({
      name: 'TestName',
      hasPetname: false,
      displayState: TrustSignalDisplayState.Unknown,
    });

    const component = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_NAME_MOCK}
        variation={VARIATION_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    await saveNameUsingTextField(
      component,
      SAVED_NAME_MOCK,
      'Suggested: TestName',
    );

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
    useDisplayNameMock.mockReturnValue({
      name: 'TestName',
      hasPetname: false,
      displayState: TrustSignalDisplayState.Unknown,
    });

    const component = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_NAME_MOCK}
        variation={VARIATION_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    await saveNameUsingDropdown(
      component,
      PROPOSED_NAME_MOCK,
      'Suggested: TestName',
    );

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
    useDisplayNameMock.mockReturnValue({
      name: SAVED_NAME_MOCK,
      hasPetname: true,
      displayState: TrustSignalDisplayState.Petname,
    });

    const component = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_SAVED_NAME_MOCK}
        variation={VARIATION_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    await saveNameUsingTextField(component, '', 'Choose a nickname...');

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
    useDisplayNameMock.mockReturnValue({
      name: SAVED_NAME_MOCK,
      hasPetname: true,
      displayState: TrustSignalDisplayState.Petname,
    });

    const component = renderWithProvider(
      <NameDetails
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_SAVED_NAME_MOCK}
        variation={VARIATION_MOCK}
        onClose={() => undefined}
      />,
      store,
    );

    await saveNameUsingTextField(
      component,
      SAVED_NAME_2_MOCK,
      'Choose a nickname...',
    );

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
        variation={VARIATION_MOCK}
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
        variation={VARIATION_MOCK}
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

      useDisplayNameMock.mockReturnValue({
        name: SAVED_NAME_MOCK,
        hasPetname: true,
        displayState: TrustSignalDisplayState.Petname,
      });

      await act(async () => {
        renderWithProvider(
          <MetaMetricsContext.Provider value={trackEventMock}>
            <NameDetails
              type={NameType.ETHEREUM_ADDRESS}
              value={ADDRESS_SAVED_NAME_MOCK}
              variation={VARIATION_MOCK}
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
      useSelectorMock.mockImplementation((selector) => {
        if (selector === getNames) {
          return {
            [NameType.ETHEREUM_ADDRESS]: {
              [ADDRESS_NO_NAME_MOCK]: {
                [VARIATION_MOCK]: {
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
                },
              },
            },
          };
        } else if (selector === getNftContractsByAddressByChain) {
          return {
            [VARIATION_MOCK]: {
              [ADDRESS_RECOGNIZED_MOCK]: {
                name: 'iZUMi Bond USD',
              },
            },
          };
        } else if (selector === getDomainResolutions) {
          return [
            {
              resolvedAddress: ADDRESS_SAVED_NAME_MOCK,
            },
          ];
        } else if (selector === getNameSources) {
          return {
            [SOURCE_ID_2_MOCK]: { label: 'Super Name Resolution Snap' },
          };
        }
        return undefined;
      });

      useDisplayNameMock.mockReturnValue({
        name: null,
        hasPetname: false,
        displayState: TrustSignalDisplayState.Unknown,
      });

      const trackEventMock = jest.fn();

      const component = renderWithProvider(
        <MetaMetricsContext.Provider value={trackEventMock}>
          <NameDetails
            type={NameType.ETHEREUM_ADDRESS}
            value={ADDRESS_NO_NAME_MOCK}
            variation={VARIATION_MOCK}
            onClose={() => undefined}
          />
        </MetaMetricsContext.Provider>,
        store,
      );

      await saveNameUsingDropdown(component, PROPOSED_NAME_MOCK);

      expect(trackEventMock).toHaveBeenNthCalledWith(2, {
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
      useSelectorMock.mockImplementation((selector) => {
        if (selector === getNames) {
          return {
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
          };
        } else if (selector === getNftContractsByAddressByChain) {
          return {
            [VARIATION_MOCK]: {
              [ADDRESS_RECOGNIZED_MOCK]: {
                name: 'iZUMi Bond USD',
              },
            },
          };
        } else if (selector === getDomainResolutions) {
          return [
            {
              resolvedAddress: ADDRESS_SAVED_NAME_MOCK,
            },
          ];
        } else if (selector === getNameSources) {
          return {
            [SOURCE_ID_2_MOCK]: { label: 'Super Name Resolution Snap' },
          };
        }
        return undefined;
      });

      useDisplayNameMock.mockReturnValue({
        name: SAVED_NAME_MOCK,
        hasPetname: true,
        displayState: TrustSignalDisplayState.Petname,
      });

      const trackEventMock = jest.fn();

      const component = renderWithProvider(
        <MetaMetricsContext.Provider value={trackEventMock}>
          <NameDetails
            type={NameType.ETHEREUM_ADDRESS}
            value={ADDRESS_SAVED_NAME_MOCK}
            variation={VARIATION_MOCK}
            onClose={() => undefined}
          />
        </MetaMetricsContext.Provider>,
        store,
      );

      await saveNameUsingDropdown(
        component,
        PROPOSED_NAME_2_MOCK,
        'Choose a nickname...',
      );

      expect(trackEventMock).toHaveBeenNthCalledWith(2, {
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
      useSelectorMock.mockImplementation((selector) => {
        if (selector === getNames) {
          return {
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
          };
        } else if (selector === getNftContractsByAddressByChain) {
          return {
            [VARIATION_MOCK]: {
              [ADDRESS_RECOGNIZED_MOCK]: {
                name: 'iZUMi Bond USD',
              },
            },
          };
        } else if (selector === getDomainResolutions) {
          return [
            {
              resolvedAddress: ADDRESS_SAVED_NAME_MOCK,
            },
          ];
        } else if (selector === getNameSources) {
          return {
            [SOURCE_ID_2_MOCK]: { label: 'Super Name Resolution Snap' },
          };
        }
        return undefined;
      });

      useDisplayNameMock.mockReturnValue({
        name: SAVED_NAME_MOCK,
        hasPetname: true,
        displayState: TrustSignalDisplayState.Petname,
      });

      const trackEventMock = jest.fn();

      const component = renderWithProvider(
        <MetaMetricsContext.Provider value={trackEventMock}>
          <NameDetails
            type={NameType.ETHEREUM_ADDRESS}
            value={ADDRESS_SAVED_NAME_MOCK}
            variation={VARIATION_MOCK}
            onClose={() => undefined}
          />
        </MetaMetricsContext.Provider>,
        store,
      );

      await saveNameUsingTextField(component, '', 'Choose a nickname...');

      expect(trackEventMock).toHaveBeenNthCalledWith(2, {
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

  describe('trust signal display states', () => {
    it('renders malicious state correctly', () => {
      useDisplayNameMock.mockReturnValue({
        name: null,
        hasPetname: false,
        displayState: TrustSignalDisplayState.Malicious,
      });

      const { getByText } = renderWithProvider(
        <NameDetails
          type={NameType.ETHEREUM_ADDRESS}
          value={ADDRESS_NO_NAME_MOCK}
          variation={VARIATION_MOCK}
          onClose={() => undefined}
        />,
        store,
      );

      expect(getByText('Malicious address')).toBeInTheDocument();
    });

    it('renders warning state correctly', () => {
      useDisplayNameMock.mockReturnValue({
        name: null,
        hasPetname: false,
        displayState: TrustSignalDisplayState.Warning,
      });

      const { getByText } = renderWithProvider(
        <NameDetails
          type={NameType.ETHEREUM_ADDRESS}
          value={ADDRESS_NO_NAME_MOCK}
          variation={VARIATION_MOCK}
          onClose={() => undefined}
        />,
        store,
      );

      expect(getByText('Suspicious address')).toBeInTheDocument();
    });

    it('renders verified state correctly', () => {
      useDisplayNameMock.mockReturnValue({
        name: 'Verified Contract',
        hasPetname: false,
        displayState: TrustSignalDisplayState.Verified,
      });

      const { getByText } = renderWithProvider(
        <NameDetails
          type={NameType.ETHEREUM_ADDRESS}
          value={ADDRESS_NO_NAME_MOCK}
          variation={VARIATION_MOCK}
          onClose={() => undefined}
        />,
        store,
      );

      expect(getByText('Verified address')).toBeInTheDocument();
    });

    it('shows footer warning for malicious state', () => {
      useDisplayNameMock.mockReturnValue({
        name: null,
        hasPetname: false,
        displayState: TrustSignalDisplayState.Malicious,
      });

      const { getByText } = renderWithProvider(
        <NameDetails
          type={NameType.ETHEREUM_ADDRESS}
          value={ADDRESS_NO_NAME_MOCK}
          variation={VARIATION_MOCK}
          onClose={() => undefined}
        />,
        store,
      );

      expect(getByText('Only save addresses you trust.')).toBeInTheDocument();
    });

    it('shows footer warning for warning state', () => {
      useDisplayNameMock.mockReturnValue({
        name: null,
        hasPetname: false,
        displayState: TrustSignalDisplayState.Warning,
      });

      const { getByText } = renderWithProvider(
        <NameDetails
          type={NameType.ETHEREUM_ADDRESS}
          value={ADDRESS_NO_NAME_MOCK}
          variation={VARIATION_MOCK}
          onClose={() => undefined}
        />,
        store,
      );

      expect(getByText('Only save addresses you trust.')).toBeInTheDocument();
    });
  });
});
