type ContractInteractionMetadata = {
  protocol: string;
  version?: string;
};

// Subset of https://github.com/MetaMask/tx-categorize heuristic map.
const CONTRACT_INTERACTION_ADDRESS_MAP: Record<
  string,
  ContractInteractionMetadata
> = {
  // Uniswap
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': {
    protocol: 'UNISWAP',
    version: 'V3',
  },
  '0xc36442b4a4522e871399cd717abdd847ab11fe88': {
    protocol: 'UNISWAP',
    version: 'V3',
  },
  '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad': {
    protocol: 'UNISWAP',
  },
  '0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b': {
    protocol: 'UNISWAP',
  },
  '0xa51afafe0263b40edaef0df8781ea9aa03e381a3': {
    protocol: 'UNISWAP_V4',
  },
  '0x6ff5693b99212da76ad316178a184ab56d299b43': {
    protocol: 'UNISWAP_V4',
  },
  '0x66a9893cc07d91d95644aedd05d03f95e1dba8af': {
    protocol: 'UNISWAP_V4',
  },
  '0x1095692a6237d83c6a72f3f5efedb9a670c49223': {
    protocol: 'UNISWAP_V4',
  },
  '0x1906c1d672b88cd1b9ac7593301ca990f94eae07': {
    protocol: 'UNISWAP_V4',
  },
  '0x851116d9223fabed8e56c0e6b8ad0c31d98b3507': {
    protocol: 'UNISWAP_V4',
  },
  '0x94b75331ae8d42c1b61065089b7d48fe14aa73b7': {
    protocol: 'UNISWAP_V4',
  },
  '0xeabbcb3e8e415306207ef514f660a3f820025be3': {
    protocol: 'UNISWAP_V4',
  },

  // 1inch
  '0x11111112542d85b3ef69ae05771c2dccff4faa26': {
    protocol: '1INCH',
    version: 'V3',
  },
  '0x1111111254fb6c44bac0bed2854e76f90643097d': {
    protocol: '1INCH',
    version: 'V4',
  },
  '0x1111111254eeb25477b68fb85ed929f73a960582': {
    protocol: '1INCH',
    version: 'V5',
  },
  '0x111111125421ca6dc452d289314280a0f8842a65': {
    protocol: '1INCH',
    version: 'V6',
  },

  // OpenSea Seaport
  '0x00000000006c3852cbef3e08e8df289169ede581': {
    protocol: 'OPENSEA',
    version: 'V1.1',
  },
  '0x00000000000001ad428e4906ae43d8f9852d0dd6': {
    protocol: 'OPENSEA',
    version: 'V1.4',
  },
  '0x00000000000000adc04c56bf30ac9d3c0aaf14dc': {
    protocol: 'OPENSEA',
    version: 'V1.5',
  },
  '0x0000000000000068f116a894984e2db1123eb395': {
    protocol: 'OPENSEA',
    version: 'V1.6',
  },

  // Common protocols
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': {
    protocol: 'WETH',
  },
  '0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f': {
    protocol: 'WETH',
  },
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': {
    protocol: '0X_V3',
  },
  '0xdef171fe48cf0115b1d80b88dc8eab59176fee57': {
    protocol: 'PARASWAP',
    version: 'V5',
  },
  '0xba12222222228d8ba445958a75a0704d566bf2c8': {
    protocol: 'BALANCER',
  },
  '0x6131b5fae19ea4f9d964eac0408e4408b66337b5': {
    protocol: 'KYBERSWAP',
    version: 'V2',
  },
  '0x398ec7346dcd622edc5ae82352f02be94c62d119': {
    protocol: 'AAVE_V1',
  },
  '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b': {
    protocol: 'COMPOUND',
  },
  '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85': {
    protocol: 'ENS',
  },
  '0x253553366da8546fc250f225fe3d25d0c782303b': {
    protocol: 'ENS',
  },
  '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72': {
    protocol: 'ENS',
  },
  '0xde1e598b81620773454588b85d6b5d4eec32573e': {
    protocol: 'LIFI',
  },
  '0xc30141b657f4216252dc59af2e7cdb9d8792e1b0': {
    protocol: 'SOCKET',
  },
  '0x5c7bcd6e7de5423a257d81b442095a1a6ced35c5': {
    protocol: 'ACROSS',
  },
  '0xb8901acb165ed027e32754e0ffe830802919727f': {
    protocol: 'HOP',
  },
};

const PROTOCOL_LABEL_OVERRIDES: Record<string, string> = {
  '0X': '0x',
  '1INCH': '1inch',
  AAVE: 'Aave',
  ENS: 'ENS',
  LIFI: 'LiFi',
  OPENSEA: 'OpenSea',
  UNISWAP: 'Uniswap',
  WETH: 'WETH',
};

const toTitleCase = (value: string) => {
  return value
    .split('_')
    .filter(Boolean)
    .map((segment) => {
      if (PROTOCOL_LABEL_OVERRIDES[segment]) {
        return PROTOCOL_LABEL_OVERRIDES[segment];
      }
      if (/^\d/u.test(segment)) {
        return segment.toLowerCase();
      }
      if (segment.length <= 2) {
        return segment.toUpperCase();
      }
      return segment.charAt(0) + segment.slice(1).toLowerCase();
    })
    .join(' ');
};

const splitProtocolVersion = (protocol: string) => {
  const match = protocol.match(/^(.*)_V(\d+(?:\.\d+)?)$/u);
  if (match) {
    return { base: match[1], version: `V${match[2]}` };
  }

  return { base: protocol, version: undefined };
};

const formatProtocolLabel = ({
  protocol,
  version,
}: ContractInteractionMetadata) => {
  const { base, version: parsedVersion } = splitProtocolVersion(protocol);
  const labelBase = PROTOCOL_LABEL_OVERRIDES[base] ?? toTitleCase(base);
  const resolvedVersion = version ?? parsedVersion;

  return resolvedVersion ? `${labelBase} ${resolvedVersion}` : labelBase;
};

export const getContractInteractionLabel = (
  address?: string | null,
): string | undefined => {
  if (!address) {
    return undefined;
  }

  const entry = CONTRACT_INTERACTION_ADDRESS_MAP[address.toLowerCase()];
  if (!entry) {
    return undefined;
  }

  return formatProtocolLabel(entry);
};
