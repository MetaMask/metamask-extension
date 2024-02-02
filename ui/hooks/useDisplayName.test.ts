import { NameEntry, NameType } from '@metamask/name-controller';
import { getMemoizedMetadataContractName } from '../selectors';
import { useDisplayName } from './useDisplayName';
import { useName } from './useName';

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => selector(),
}));

jest.mock('./useName', () => ({
  useName: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getMemoizedMetadataContractName: jest.fn(),
}));

const VALUE_MOCK = '0xabc123';
const TYPE_MOCK = NameType.ETHEREUM_ADDRESS;
const NAME_MOCK = 'TestName';
const CONTRACT_NAME_MOCK = 'TestContractName';

const NO_CONTRACT_NAME_FOUND_RETURN_VALUE = null;
const NO_PETNAME_FOUND_RETURN_VALUE = {
  name: null,
} as NameEntry;

const PETNAME_FOUND_RETURN_VALUE = {
  name: NAME_MOCK,
} as NameEntry;

describe('useDisplayName', () => {
  const getMemoizedMetadataContractNameMock = jest.mocked(
    getMemoizedMetadataContractName,
  );
  const useNameMock = jest.mocked(useName);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns null if no name is found', () => {
    useNameMock.mockReturnValue(NO_PETNAME_FOUND_RETURN_VALUE);
    getMemoizedMetadataContractNameMock.mockReturnValue(
      NO_CONTRACT_NAME_FOUND_RETURN_VALUE,
    );

    const name = useDisplayName(VALUE_MOCK, TYPE_MOCK);

    expect(name).toBe(null);
  });

  it('returns a petname if one is found, even if a contract name exists', () => {
    useNameMock.mockReturnValue(PETNAME_FOUND_RETURN_VALUE);
    getMemoizedMetadataContractNameMock.mockReturnValue(CONTRACT_NAME_MOCK);

    const name = useDisplayName(VALUE_MOCK, TYPE_MOCK);

    expect(name).toBe(NAME_MOCK);
  });

  it('returns a contract name if one is found, if no petname exists', () => {
    useNameMock.mockReturnValue(NO_PETNAME_FOUND_RETURN_VALUE);
    getMemoizedMetadataContractNameMock.mockReturnValue(CONTRACT_NAME_MOCK);

    const name = useDisplayName(VALUE_MOCK, TYPE_MOCK);

    expect(name).toBe(CONTRACT_NAME_MOCK);
  });
});
