export function upperCaseFirstLetter (value: string) {
  return `${value.charAt(0).toUpperCase()}${value.toLowerCase().slice(1)}`;
}
