export function getOutputFileName(inputFileName: string, operation: 'convert' | 'compress' = 'convert'): string {
  const baseName = inputFileName.replace(/\.[^/.]+$/, "");
  const suffix = operation === 'compress' ? '-compressed' : '-converted';
  return `${baseName}${suffix}.pdf`;
}