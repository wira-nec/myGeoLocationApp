export function blobsFilter(value: string): boolean {
  return /^(data:image\/)/i.test(value);
}
