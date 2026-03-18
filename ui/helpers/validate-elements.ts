/**
 * Validates that each element of a tuple is a member of the given union,
 * producing a type error for elements that aren't.
 */
export type ValidateElements<
  Elements extends readonly string[],
  AllowedElements extends string,
> = {
  [K in keyof Elements]: Elements[K] extends AllowedElements
    ? Elements[K]
    : AllowedElements;
};
