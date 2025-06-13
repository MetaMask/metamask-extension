import {
  toDelegationStruct,
  type Delegation,
  type DelegationStruct,
  ROOT_AUTHORITY,
  createDelegation,
  createOpenDelegation,
  resolveAuthority,
  ANY_BENEFICIARY,
  encodeDisableDelegation,
  encodeRedeemDelegations,
} from './delegation';
import { type Caveat } from './caveat';
import { type CaveatBuilder, resolveCaveats } from './caveatBuilder';
import { type Hex, toFunctionSelector } from './utils';
import {
  ExecutionMode,
  type ExecutionStruct,
  SINGLE_DEFAULT_MODE,
} from './execution';

const mockDelegate = '0x1234567890123456789012345678901234567890' as Hex;
const mockDelegator = '0x0987654321098765432109876543210987654321' as Hex;
const mockSignature =
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as Hex;

describe('toDelegationStruct', () => {
  it('should convert a basic delegation to struct', () => {
    const delegation: Delegation = {
      delegate: mockDelegate,
      delegator: mockDelegator,
      authority: ROOT_AUTHORITY,
      caveats: [],
      salt: '0x123',
      signature: mockSignature,
    };

    const result = toDelegationStruct(delegation);
    expect(result).toStrictEqual({
      delegate: mockDelegate,
      delegator: mockDelegator,
      authority: ROOT_AUTHORITY,
      caveats: [],
      salt: 291n,
      signature: mockSignature,
    });
  });

  it('should handle delegations with caveats', () => {
    const delegation: Delegation = {
      delegate: mockDelegate,
      delegator: mockDelegator,
      authority: ROOT_AUTHORITY,
      caveats: [
        {
          enforcer: '0x1111111111111111111111111111111111111111',
          terms: '0x',
          args: '0x',
        },
      ],
      salt: '0x123',
      signature: mockSignature,
    };

    const result = toDelegationStruct(delegation);
    expect(result).toStrictEqual({
      delegate: mockDelegate,
      delegator: mockDelegator,
      authority: ROOT_AUTHORITY,
      caveats: [
        {
          enforcer: '0x1111111111111111111111111111111111111111',
          terms: '0x',
          args: '0x',
        },
      ],
      salt: 291n,
      signature: mockSignature,
    });
  });

  it('should handle delegations that are already DelegationStruct (for backwards compatibility)', () => {
    const delegationStruct: DelegationStruct = {
      delegate: mockDelegate,
      delegator: mockDelegator,
      authority: ROOT_AUTHORITY,
      caveats: [
        {
          enforcer: '0x1111111111111111111111111111111111111111',
          terms: '0x',
          args: '0x',
        },
      ],
      salt: 123n,
      signature: mockSignature,
    };

    const result = toDelegationStruct(
      delegationStruct as unknown as Delegation,
    );
    expect(result).toStrictEqual(delegationStruct);
  });
});

describe('resolveAuthority', () => {
  it('should return ROOT_AUTHORITY when no parent delegation is provided', () => {
    expect(resolveAuthority()).toBe(ROOT_AUTHORITY);
  });

  it('should return the hash directly when parent delegation is a hex string', () => {
    const parentHash =
      '0x1234567890123456789012345678901234567890123456789012345678901234' as Hex;
    expect(resolveAuthority(parentHash)).toBe(parentHash);
  });

  it('should compute hash when parent delegation is a Delegation object', () => {
    const parentDelegation: Delegation = {
      delegate: mockDelegate,
      delegator: mockDelegator,
      authority: ROOT_AUTHORITY,
      caveats: [],
      salt: '0x',
      signature: '0x',
    };
    const result = resolveAuthority(parentDelegation);
    expect(result).toBeDefined();
    expect(result).not.toBe(ROOT_AUTHORITY);
  });
});

describe('createDelegation', () => {
  it('should create a basic delegation with root authority', () => {
    const result = createDelegation({
      to: mockDelegate,
      from: mockDelegator,
      caveats: [],
    });

    expect(result).toMatchObject({
      delegate: mockDelegate,
      delegator: mockDelegator,
      authority: ROOT_AUTHORITY,
      caveats: [],
      signature: '0x',
    });
  });

  it('should create a delegation with parent delegation authority', () => {
    const parentHash =
      '0x1234567890123456789012345678901234567890123456789012345678901234' as Hex;
    const result = createDelegation({
      to: mockDelegate,
      from: mockDelegator,
      caveats: [],
      parentDelegation: parentHash,
    });

    expect(result).toMatchObject({
      delegate: mockDelegate,
      delegator: mockDelegator,
      authority: parentHash,
      caveats: [],
      signature: '0x',
    });
  });

  it('should create a delegation with caveats', () => {
    const caveats: Caveat[] = [
      {
        enforcer: '0x1111111111111111111111111111111111111111',
        terms: '0x',
        args: '0x',
      },
    ];

    const result = createDelegation({
      to: mockDelegate,
      from: mockDelegator,
      caveats,
    });

    expect(result).toMatchObject({
      delegate: mockDelegate,
      delegator: mockDelegator,
      authority: ROOT_AUTHORITY,
      caveats: [
        {
          enforcer: '0x1111111111111111111111111111111111111111',
          terms: '0x',
          args: '0x',
        },
      ],
      signature: '0x',
    });
  });
});

describe('createOpenDelegation', () => {
  it('should create a basic open delegation with root authority', () => {
    const result = createOpenDelegation({
      from: mockDelegator,
      caveats: [],
    });

    expect(result).toStrictEqual({
      delegate: ANY_BENEFICIARY,
      delegator: mockDelegator,
      authority: ROOT_AUTHORITY,
      caveats: [],
      salt: '0x',
      signature: '0x',
    });
  });

  it('should create an open delegation with parent delegation authority', () => {
    const parentHash =
      '0x1234567890123456789012345678901234567890123456789012345678901234' as Hex;
    const result = createOpenDelegation({
      from: mockDelegator,
      caveats: [],
      parentDelegation: parentHash,
    });

    expect(result).toStrictEqual({
      delegate: ANY_BENEFICIARY,
      delegator: mockDelegator,
      authority: parentHash,
      caveats: [],
      salt: '0x',
      signature: '0x',
    });
  });

  it('should create an open delegation with caveats', () => {
    const caveats: Caveat[] = [
      {
        enforcer: '0x1111111111111111111111111111111111111111',
        terms: '0x',
        args: '0x',
      },
    ];

    const result = createOpenDelegation({
      from: mockDelegator,
      caveats,
    });

    expect(result).toStrictEqual({
      delegate: ANY_BENEFICIARY,
      delegator: mockDelegator,
      authority: ROOT_AUTHORITY,
      caveats: [
        {
          enforcer: '0x1111111111111111111111111111111111111111',
          terms: '0x',
          args: '0x',
        },
      ],
      salt: '0x',
      signature: '0x',
    });
  });
});

describe('resolveCaveats', () => {
  it('should return the same array when given a Caveat array', () => {
    const caveats: Caveat[] = [
      {
        enforcer: '0x1111111111111111111111111111111111111111',
        terms: '0x',
        args: '0x',
      },
    ];

    const result = resolveCaveats(caveats);
    expect(result).toBe(caveats);
    expect(result).toStrictEqual(caveats);
  });

  it('should call build() and return result when given a CaveatBuilder', () => {
    const mockCaveats: Caveat[] = [
      {
        enforcer: '0x1111111111111111111111111111111111111111',
        terms: '0x',
        args: '0x',
      },
    ];

    const mockBuilder = {
      build: () => mockCaveats,
    };

    const result = resolveCaveats(mockBuilder as unknown as CaveatBuilder);
    expect(result).toStrictEqual(mockCaveats);
  });

  it('should handle build() throwing an error', () => {
    const mockBuilder = {
      build: () => {
        throw new Error('Build failed');
      },
    };

    expect(() =>
      resolveCaveats(mockBuilder as unknown as CaveatBuilder),
    ).toThrow('Build failed');
  });
});

describe('encodeDisableDelegation', () => {
  it('should encode a disableDelegation call', () => {
    const delegation: Delegation = {
      delegate: mockDelegate,
      delegator: mockDelegator,
      authority: ROOT_AUTHORITY,
      caveats: [],
      salt: '0x123',
      signature: mockSignature,
    };

    const result = encodeDisableDelegation({ delegation });

    const expectedSelector = toFunctionSelector(
      'disableDelegation((address,address,bytes32,(address,bytes,bytes)[],uint256,bytes))',
    );

    expect(result).toMatch(/^0x[0-9a-fA-F]+$/u);
    expect(result.startsWith(expectedSelector)).toBe(true);
  });
});

describe('encodeRedeemDelegations', () => {
  it('should encode a basic redeemDelegations call', () => {
    const delegations: Delegation[][] = [
      [
        {
          delegate: mockDelegate,
          delegator: mockDelegator,
          authority: ROOT_AUTHORITY,
          caveats: [],
          salt: '0x123',
          signature: mockSignature,
        },
      ],
    ];
    const modes: ExecutionMode[] = [SINGLE_DEFAULT_MODE];
    const executions: ExecutionStruct[][] = [
      [
        {
          target: mockDelegate, // Example target
          value: 0n, // Example value
          callData: '0x' as Hex, // Changed 'data' to 'callData'
        },
      ],
    ];

    const result = encodeRedeemDelegations({ delegations, modes, executions });

    const expectedSelector = toFunctionSelector(
      'redeemDelegations(bytes[],bytes32[],bytes[])',
    );

    // This is a simple check to ensure the function returns a hex string.
    expect(result).toMatch(/^0x[0-9a-fA-F]+$/u);
    // Check if the result starts with the correct function selector
    expect(result.startsWith(expectedSelector)).toBe(true);
  });
});
