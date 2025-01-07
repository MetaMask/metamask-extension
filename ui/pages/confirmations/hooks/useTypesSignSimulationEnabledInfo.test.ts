import { getMockTypedSignConfirmStateForRequest } from '../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { permitSingleSignatureMsg, seaportSignatureMsg, unapprovedTypedSignMsgV1, } from '../../../../test/data/confirmations/typed_sign';
import { useTypesSignSimulationEnabledInfo } from './useTypesSignSimulationEnabledInfo';
describe('useTypesSignSimulationEnabledInfo', () => {
    it('return false if user has disabled simulations', async () => {
        const state = getMockTypedSignConfirmStateForRequest(permitSingleSignatureMsg, {
            PreferencesController: {
                useTransactionSimulations: false
            }
        });
        const { result } = renderHookWithConfirmContextProvider(() => useTypesSignSimulationEnabledInfo(), state);
        expect(result.current).toBe(false);
    });
    it('return false if request is not types sign v3 or V4', async () => {
        const state = getMockTypedSignConfirmStateForRequest(unapprovedTypedSignMsgV1, {
            PreferencesController: {
                useTransactionSimulations: true
            }
        });
        const { result } = renderHookWithConfirmContextProvider(() => useTypesSignSimulationEnabledInfo(), state);
        expect(result.current).toBe(false);
    });
    it('return true for typed sign v4 permit request', async () => {
        const state = getMockTypedSignConfirmStateForRequest(permitSingleSignatureMsg, {
            PreferencesController: {
                useTransactionSimulations: true
            }
        });
        const { result } = renderHookWithConfirmContextProvider(() => useTypesSignSimulationEnabledInfo(), state);
        expect(result.current).toBe(true);
    });
    it('return true for typed sign v4 seaport request', async () => {
        const state = getMockTypedSignConfirmStateForRequest(seaportSignatureMsg, {
            PreferencesController: {
                useTransactionSimulations: true
            }
        });
        const { result } = renderHookWithConfirmContextProvider(() => useTypesSignSimulationEnabledInfo(), state);
        expect(result.current).toBe(true);
    });
});
