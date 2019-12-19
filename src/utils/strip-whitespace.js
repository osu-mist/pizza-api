/**
 * Remove sequences of whitespace greater than 1 character from `str`
 *
 * @param {string} str
 * @returns {string}
 */
const strip = (str) => str.replace(/\s+/g, ' ');

export { strip };
