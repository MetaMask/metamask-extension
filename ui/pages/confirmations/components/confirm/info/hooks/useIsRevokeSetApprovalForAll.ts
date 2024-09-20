type Param = { value: boolean };
type DataItem = { name: string; params: Param[] };

export function getIsRevokeSetApprovalForAll(value: {
  data: DataItem[];
}): boolean {
  const isRevokeSetApprovalForAll =
    value?.data?.[0]?.name === 'setApprovalForAll' &&
    value?.data?.[0]?.params?.[1]?.value === false;

  return isRevokeSetApprovalForAll;
}
