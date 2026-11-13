import { getHiddenPillCount } from './get-hidden-pill-count';

describe('getHiddenPillCount', () => {
  it('returns 0 when there are no pills', () => {
    expect(getHiddenPillCount([], 250, 8, 40)).toBe(0);
  });

  it('returns 0 when every pill fits on the row', () => {
    expect(getHiddenPillCount([100, 100, 100], 316, 8, 40)).toBe(0);
  });

  it('hides the trailing pill when the toggle still fits beside the rest', () => {
    expect(getHiddenPillCount([100, 100, 100], 250, 0, 40)).toBe(1);
  });

  it('hides another pill when the toggle needs the room', () => {
    expect(getHiddenPillCount([100, 100, 100], 250, 0, 80)).toBe(2);
  });

  it('hides the pills that overflow before the toggle has been measured', () => {
    expect(getHiddenPillCount([100, 100, 100], 250, 0, 0)).toBe(1);
  });

  it('counts the gap between pills and before the toggle', () => {
    expect(getHiddenPillCount([100, 100], 148, 8, 40)).toBe(1);
    expect(getHiddenPillCount([100, 100], 147, 8, 40)).toBe(2);
  });
});
