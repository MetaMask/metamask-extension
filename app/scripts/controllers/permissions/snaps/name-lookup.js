const specificationBuilder = (_builderOptions) => {
  return {
    permissionType: 'Endowment',
    targetName: 'endowment:name-lookup',
    allowedCaveats: null,
    endowmentGetter: (_getterOptions) => undefined,
    subjectTypes: ['snap'],
  };
};

export const nameLookupEndowmentBuilder = Object.freeze({
  targetName: 'endowment:name-lookup',
  specificationBuilder,
});
