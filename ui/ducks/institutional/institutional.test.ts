import InstitutionalReducer, {
  getInstitutionalConnectRequests,
} from './institutional';

describe('Institutional Duck', () => {
  const initState = {
    metamask: {
      institutionalFeatures: {
        connectRequests: undefined,
        channelId: undefined,
        connectionRequest: undefined,
      },
    },
  };

  describe('InstitutionalReducer', () => {
    it('should initialize state', () => {
      expect(InstitutionalReducer(undefined, { type: 'init' })).toStrictEqual(
        initState,
      );
    });

    it('should correctly return all getters values', async () => {
      const state = {
        metamask: {
          institutionalFeatures: {
            connectRequests: [
              {
                channelId: 'channelId',
                traceId: 'traceId',
                token: 'token',
                environment: 'environment',
                feature: 'feature',
                service: 'service',
                origin: 'origin',
                custodian: 'custodian',
                chainId: 'chainId',
                labels: [{ key: 'testKey', value: 'value' }],
              },
            ],
          },
        },
      };
      expect(getInstitutionalConnectRequests(state)).toHaveLength(1);
    });
  });
});
