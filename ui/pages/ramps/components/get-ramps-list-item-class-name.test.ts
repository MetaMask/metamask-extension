import { getRampsListItemClassName } from './get-ramps-list-item-class-name';

describe('getRampsListItemClassName', () => {
  it('returns the row styles for each selection state', () => {
    expect({
      selected: getRampsListItemClassName(true),
      unselected: getRampsListItemClassName(false),
    }).toMatchInlineSnapshot(`
      {
        "selected": "w-full rounded-none px-4 py-3 min-h-14 min-w-0 h-auto hover:bg-hover active:bg-pressed bg-background-muted",
        "unselected": "w-full rounded-none px-4 py-3 min-h-14 min-w-0 h-auto hover:bg-hover active:bg-pressed bg-transparent",
      }
    `);
  });
});
