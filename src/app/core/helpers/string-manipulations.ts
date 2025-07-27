import { deburr } from 'lodash';

const nonSpacingMarkRegex = new RegExp('\\p{Mn}', 'gu');
const nonRelevantAddressCharactersRegex = new RegExp(/(,|'|-|\s)/, 'g');
const filterFilename = new RegExp(/[^\\]+(?=(?:\.[^.]+)?$)/);
const findYearFolderName = new RegExp(/(\\+\d{4}?\\+)/);
const findYearFilename = new RegExp(/^\d{4}_/);
const IMAGE_EXTENSION_REGEX = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i;

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

export const getPathWithoutFilename = (filename: string) =>
  filename.replace(filterFilename, '');

export const getHyperlinkBasePath = (hyperlink: string) =>
  hyperlink.split(findYearFolderName, 2).join('');

export const convertYearFilename = (filename: string) => {
  if (findYearFilename.test(filename)) {
    const filenameWithoutYear = filename.replace(findYearFilename, '');
    const fileExtension = filenameWithoutYear.match(IMAGE_EXTENSION_REGEX)?.[0];
    return (
      filenameWithoutYear
        .replace(IMAGE_EXTENSION_REGEX, '')
        .split('_', 2)
        .reverse()
        .join(' ') + fileExtension
    );
  }
  return filename;
};
