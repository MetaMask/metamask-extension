import { NameEntry, NameType } from '@metamask/name-controller';
import { getMemoizedMetadataContractName } from '../selectors';
import { useDisplayName } from './useDisplayName';
import { useName } from './useName';
import { useFirstPartyContractName } from './useFirstPartyContractName';

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => selector(),
}));

jest.mock('./useName', () => ({
  useName: jest.fn(),
}));

jest.mock('./useFirstPartyContractName', () => ({
  useFirstPartyContractName: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getMemoizedMetadataContractName: jest.fn(),
  getCurrentChainId: jest.fn(),
}));

const VALUE_MOCK = '0xabc123';
const TYPE_MOCK = NameType.ETHEREUM_ADDRESS;
const NAME_MOCK = 'TestName';
const CONTRACT_NAME_MOCK = 'TestContractName';
const FIRST_PARTY_CONTRACT_NAME_MOCK = 'MetaMask Bridge';

const NO_PETNAME_FOUND_RETURN_VALUE = {
  name: null,
} as NameEntry;
const NO_CONTRACT_NAME_FOUND_RETURN_VALUE = '';
const NO_FIRST_PARTY_CONTRACT_NAME_FOUND_RETURN_VALUE = null;

const PETNAME_FOUND_RETURN_VALUE = {
  name: NAME_MOCK,
} as NameEntry;

describe('useDisplayName', () => {
  const useNameMock = jest.mocked(useName);
  const getMemoizedMetadataContractNameMock = jest.mocked(
    getMemoizedMetadataContractName,
  );
  const useFirstPartyContractNameMock = jest.mocked(useFirstPartyContractName);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('handles no name found', () => {
    useNameMock.mockReturnValue(NO_PETNAME_FOUND_RETURN_VALUE);
    useFirstPartyContractNameMock.mockReturnValue(null);
    getMemoizedMetadataContractNameMock.mockReturnValue(
      NO_CONTRACT_NAME_FOUND_RETURN_VALUE,
    );

    expect(useDisplayName(VALUE_MOCK, TYPE_MOCK)).toEqual({
      name: null,
      hasPetname: false,
    });
  });

  it('prioritizes a petname over all else', () => {
    useNameMock.mockReturnValue(PETNAME_FOUND_RETURN_VALUE);
    useFirstPartyContractNameMock.mockReturnValue(
      FIRST_PARTY_CONTRACT_NAME_MOCK,
    );
    getMemoizedMetadataContractNameMock.mockReturnValue(CONTRACT_NAME_MOCK);

    expect(useDisplayName(VALUE_MOCK, TYPE_MOCK)).toEqual({
      name: NAME_MOCK,
      hasPetname: true,
    });
  });

  it('prioritizes a first-party contract name over a contract name', () => {
    useNameMock.mockReturnValue(NO_PETNAME_FOUND_RETURN_VALUE);
    useFirstPartyContractNameMock.mockReturnValue(
      FIRST_PARTY_CONTRACT_NAME_MOCK,
    );
    getMemoizedMetadataContractNameMock.mockReturnValue(CONTRACT_NAME_MOCK);

    expect(useDisplayName(VALUE_MOCK, TYPE_MOCK)).toEqual({
      name: FIRST_PARTY_CONTRACT_NAME_MOCK,
      hasPetname: false,
    });
  });

  it('returns a contract name if no other name is found', () => {
    useNameMock.mockReturnValue(NO_PETNAME_FOUND_RETURN_VALUE);
    useFirstPartyContractNameMock.mockReturnValue(
      NO_FIRST_PARTY_CONTRACT_NAME_FOUND_RETURN_VALUE,
    );
    getMemoizedMetadataContractNameMock.mockReturnValue(CONTRACT_NAME_MOCK);

    expect(useDisplayName(VALUE_MOCK, TYPE_MOCK)).toEqual({
      name: CONTRACT_NAME_MOCK,
      hasPetname: false,
    });
  });
});
