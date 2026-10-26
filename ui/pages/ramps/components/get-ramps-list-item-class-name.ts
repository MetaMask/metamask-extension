const RAMPS_LIST_ITEM_CLASS_NAME =
  'w-full rounded-none px-4 py-3 min-h-14 min-w-0 h-auto hover:bg-hover active:bg-pressed';

export function getRampsListItemClassName(isSelected: boolean): string {
  const backgroundClassName = isSelected
    ? 'bg-background-muted'
    : 'bg-transparent';

  return `${RAMPS_LIST_ITEM_CLASS_NAME} ${backgroundClassName}`;
}
