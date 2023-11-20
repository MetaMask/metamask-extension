import InstitutionalReducer, {
  getInstitutionalConnectRequests,
} from './institutional';

describe('Institutional Duck', () => {
  const initState = {};

  describe('InstitutionalReducer', () => {
    it('should initialize state', () => {
      expect(InstitutionalReducer(undefined, {})).toStrictEqual(initState);
    });

    it('should correctly return all getters values', async () => {
      const state = {
        metamask: {
          institutionalFeatures: {
            connectRequests: [{ id: 'id' }],
          },
        },
      };
      expect(getInstitutionalConnectRequests(state)).toHaveLength(1);
    });
  });
});
