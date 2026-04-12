import { applyChangePasswordBiometricsToggle } from './change-password-biometrics';

describe('applyChangePasswordBiometricsToggle', () => {
  it('sets biometrics on when checked', () => {
    const setEnableBiometrics = jest.fn();
    applyChangePasswordBiometricsToggle({
      nextChecked: true,
      setEnableBiometrics,
    });
    expect(setEnableBiometrics).toHaveBeenCalledWith(true);
  });

  it('sets biometrics off when unchecked', () => {
    const setEnableBiometrics = jest.fn();
    applyChangePasswordBiometricsToggle({
      nextChecked: false,
      setEnableBiometrics,
    });
    expect(setEnableBiometrics).toHaveBeenCalledWith(false);
  });
});
