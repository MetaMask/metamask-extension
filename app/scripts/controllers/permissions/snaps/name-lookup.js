const specificationBuilder = (_builderOptions) => {
  return {
    permissionType: 'Endowment',
    targetKey: 'endowment:name-lookup',
    allowedCaveats: null,
    endowmentGetter: (_getterOptions) => undefined,
    subjectTypes: ['snap'],
  };
};

export const nameLookupEndowmentBuilder = Object.freeze({
  targetKey: 'endowment:name-lookup',
  specificationBuilder,
});
