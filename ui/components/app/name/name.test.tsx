import * as React from 'react';
import { NameType } from '@metamask/name-controller';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { updateProposedNames } from '../../../store/actions';
import Name from './name';

jest.mock('../../../store/actions', () => ({
  updateProposedNames: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

const ADDRESS_NO_PROPOSED_NAME_MOCK =
  '0xc0ffee254729296a45a3885639AC7E10F9d54979';
const ADDRESS_PROPOSED_NAME_MOCK = '0xc0ffee254729296a45a3885639AC7E10F9d54978';
const ADDRESS_SAVED_NAME_MOCK = '0xc0ffee254729296a45a3885639AC7E10F9d54977';
const ADDRESS_LAST_UPDATED_MOCK = '0xc0ffee254729296a45a3885639AC7E10F9d54976';
const CHAIN_ID_MOCK = '0x1';
const PROPOSED_NAME_MOCK = 'TestProposedName';
const PROPOSED_NAME_2_MOCK = 'TestProposedName2';
const SAVED_NAME_MOCK = 'TestName';
const SOURCE_ID_MOCK = 'TestSourceId';
const SOURCE_ID_2_MOCK = 'TestSourceId2';
const SOURCE_ID_EMPTY_MOCK = 'TestSourceIdEmpty';
const SOURCE_ID_UNDEFINED_MOCK = 'TestSourceIdUndefined';
const LAST_UPDATED_MOCK = 150;
const DEFAULT_UPDATE_DELAY = 300;

const STATE_MOCK = {
  metamask: {
    providerConfig: {
      chainId: CHAIN_ID_MOCK,
    },
    names: {
      [NameType.ETHEREUM_ADDRESS]: {
        [ADDRESS_PROPOSED_NAME_MOCK]: {
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
            proposedNames: null,
            name: SAVED_NAME_MOCK,
          },
        },
        [ADDRESS_LAST_UPDATED_MOCK]: {
          [CHAIN_ID_MOCK]: {
            proposedNamesLastUpdated: LAST_UPDATED_MOCK,
          },
        },
      },
    },
  },
};

describe('Name', () => {
  const store = configureStore()(STATE_MOCK);
  const updateProposedNamesMock = jest.mocked(updateProposedNames);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders address without proposed name', () => {
    const { container } = renderWithProvider(
      <Name
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_PROPOSED_NAME_MOCK}
        sourcePriority={[]}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders address with proposed name', () => {
    const { container } = renderWithProvider(
      <Name
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_PROPOSED_NAME_MOCK}
        sourcePriority={[SOURCE_ID_MOCK]}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders address with saved name', () => {
    const { container } = renderWithProvider(
      <Name
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_SAVED_NAME_MOCK}
        sourcePriority={[]}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders address with proposed name according to source priority', () => {
    const { container } = renderWithProvider(
      <Name
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_PROPOSED_NAME_MOCK}
        sourcePriority={[
          SOURCE_ID_EMPTY_MOCK,
          SOURCE_ID_UNDEFINED_MOCK,
          SOURCE_ID_MOCK,
          SOURCE_ID_2_MOCK,
        ]}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('updates proposed names on render', () => {
    renderWithProvider(
      <Name
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_PROPOSED_NAME_MOCK}
      />,
      store,
    );

    expect(updateProposedNamesMock).toHaveBeenCalledWith({
      value: ADDRESS_NO_PROPOSED_NAME_MOCK,
      type: NameType.ETHEREUM_ADDRESS,
    });
  });

  it('does not update proposed names on render if disabled', () => {
    renderWithProvider(
      <Name
        type={NameType.ETHEREUM_ADDRESS}
        value={ADDRESS_NO_PROPOSED_NAME_MOCK}
        disableUpdate
      />,
      store,
    );

    expect(updateProposedNamesMock).toHaveBeenCalledTimes(0);
  });

  it.each([
    ['default', undefined],
    ['custom', 10000],
  ])(
    'does not update proposed names on subsequent render until %s delay has elapsed',
    async (_, updateDelay) => {
      jest
        .spyOn(Date, 'now')
        .mockReturnValue(
          (LAST_UPDATED_MOCK + (updateDelay ?? DEFAULT_UPDATE_DELAY) - 1) *
            1000,
        );

      const { rerender } = renderWithProvider(
        <Name
          type={NameType.ETHEREUM_ADDRESS}
          value={ADDRESS_LAST_UPDATED_MOCK}
          updateDelay={updateDelay}
        />,
        store,
      );

      expect(updateProposedNamesMock).toHaveBeenCalledTimes(0);

      rerender(
        <Name
          type={NameType.ETHEREUM_ADDRESS}
          value={ADDRESS_LAST_UPDATED_MOCK}
          updateDelay={updateDelay}
        />,
      );

      expect(updateProposedNamesMock).toHaveBeenCalledTimes(0);

      jest
        .spyOn(Date, 'now')
        .mockReturnValue(
          (LAST_UPDATED_MOCK + (updateDelay ?? DEFAULT_UPDATE_DELAY)) * 1000,
        );

      rerender(
        <Name
          type={NameType.ETHEREUM_ADDRESS}
          value={ADDRESS_LAST_UPDATED_MOCK}
          updateDelay={updateDelay}
        />,
      );

      expect(updateProposedNamesMock).toHaveBeenCalledTimes(1);
    },
  );
});
