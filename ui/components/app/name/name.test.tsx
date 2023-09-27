import * as React from 'react';
import { NameType } from '@metamask/name-controller';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import Name from './name';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

const ADDRESS_NO_SAVED_NAME_MOCK = '0xc0ffee254729296a45a3885639ac7e10f9d54977';
const ADDRESS_SAVED_NAME_MOCK = '0xc0ffee254729296a45a3885639ac7e10f9d54979';
const CHAIN_ID_MOCK = '0x1';
const PROPOSED_NAME_MOCK = 'TestProposedName';
const PROPOSED_NAME_2_MOCK = 'TestProposedName2';
const SAVED_NAME_MOCK = 'TestName';
const SOURCE_ID_MOCK = 'TestSourceId';
const SOURCE_ID_2_MOCK = 'TestSourceId2';
const SOURCE_ID_EMPTY_MOCK = 'TestSourceIdEmpty';
const SOURCE_ID_UNDEFINED_MOCK = 'TestSourceIdUndefined';

const STATE_MOCK = {
  metamask: {
    providerConfig: {
      chainId: CHAIN_ID_MOCK,
    },
    names: {
      [NameType.ETHEREUM_ADDRESS]: {
        [ADDRESS_NO_SAVED_NAME_MOCK]: {
          [CHAIN_ID_MOCK]: {
            proposedNames: {
              [SOURCE_ID_MOCK]: [PROPOSED_NAME_MOCK],
              [SOURCE_ID_2_MOCK]: [PROPOSED_NAME_2_MOCK],
              [SOURCE_ID_EMPTY_MOCK]: [],
              [SOURCE_ID_UNDEFINED_MOCK]: undefined,
            },
          },
        },
        [ADDRESS_SAVED_NAME_MOCK]: {
          [CHAIN_ID_MOCK]: {
            proposedNames: { [SOURCE_ID_MOCK]: [PROPOSED_NAME_MOCK] },
            name: SAVED_NAME_MOCK,
          },
        },
      },
    },
  },
};

describe('Name', () => {
  const store = configureStore()(STATE_MOCK);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders address with no saved name', () => {
    const { container } = renderWithProvider(
      <Name
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_SAVED_NAME_MOCK}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders address with saved name', () => {
    const { container } = renderWithProvider(
      <Name type={NameType.ETHEREUM_ADDRESS} value={ADDRESS_SAVED_NAME_MOCK} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  describe('metrics', () => {
    it.each([
      ['saved', ADDRESS_SAVED_NAME_MOCK, true],
      ['not saved', ADDRESS_NO_SAVED_NAME_MOCK, false],
    ])('sends displayed event with %s name', async (_, value, hasPetname) => {
      const trackEventMock = jest.fn();

      renderWithProvider(
        <MetaMetricsContext.Provider value={trackEventMock}>
          <Name type={NameType.ETHEREUM_ADDRESS} value={value} />
        </MetaMetricsContext.Provider>,
        store,
      );

      expect(trackEventMock).toHaveBeenCalledWith({
        event: MetaMetricsEventName.PetnameDisplayed,
        category: MetaMetricsEventCategory.Petnames,
        properties: {
          petname_category: NameType.ETHEREUM_ADDRESS,
          has_petname: hasPetname,
        },
      });
    });
  });
});
