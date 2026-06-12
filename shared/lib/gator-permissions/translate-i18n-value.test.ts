import { translateI18nValue } from './translate-i18n-value';

describe('translateI18nValue', () => {
  it('passes key and args to the i18n function', () => {
    const t = jest.fn().mockReturnValue('translated');
    const result = translateI18nValue(t, {
      key: 'someKey',
      args: [1, 'two'],
    });
    expect(t).toHaveBeenCalledWith('someKey', [1, 'two']);
    expect(result).toBe('translated');
  });

  it('omits args when undefined', () => {
    const t = jest.fn().mockReturnValue('ok');
    translateI18nValue(t, { key: 'plain' });
    expect(t).toHaveBeenCalledWith('plain', undefined);
  });
});
