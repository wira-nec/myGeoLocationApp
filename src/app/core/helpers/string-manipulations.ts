import { deburr } from 'lodash';

const nonSpacingMarkRegex = new RegExp('\\p{Mn}', 'gu');
const nonRelevantAddressCharactersRegex = new RegExp(/(,|'|-|\s)/, 'g');

export const removeDiacritics = (text: string) => {
  if (text == null) {
    return '';
  }
  const normalizedText = deburr(text.normalize('NFC'));
  return normalizedText.replace(nonSpacingMarkRegex, '');
};

export const makeAddressComparable = (address: string) =>
  removeDiacritics(address)
    .replaceAll(nonRelevantAddressCharactersRegex, '')
    .toLowerCase();
