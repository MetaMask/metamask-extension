import React from 'react';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { ReviewPermissions } from './review-permissions-page';
const render = (state = {}) => {
    const store = configureStore({
        PermissionLogController: {
            permissionHistory: {
                'https://test.dapp': {
                    eth_accounts: {
                        accounts: {
                            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1709225290848,
                        },
                    },
                },
            }
        }
    });
    return renderWithProvider(<ReviewPermissions>/>, store););
};
describe('ReviewPermissions', () => {
    it('should render correctly', () => {
        const { container } = render();
        expect(container).toMatchSnapshot();
    });
});
