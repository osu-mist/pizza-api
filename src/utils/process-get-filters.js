import _ from 'lodash';
/**
 * Removes the "filter[]" wrapper from a filter parameter
 *
 * @param {string} filterName
 * @returns {string} the filter name with 'filter' and brackets removed
 */
const normalizeFilterName = (filterName) => {
  const filterTextRegex = /filter\[(.*)\]/g;
  const regexResults = filterTextRegex.exec(filterName);
  return regexResults ? regexResults[1] : filterName;
};

/**
 * Returns filters with keys changed to remove the "filter[]" wrapper
 *
 * @param {object} filters
 * @returns {object}
 */
const normalizeFilterNames = (filters) => _.mapKeys(filters,
  (filterValue, filterName) => normalizeFilterName(filterName));

class GetFilterProcessor {
  constructor(getParameters, columnNames) {
    this.getParameters = getParameters;
    this.columnNames = columnNames;
    this.normalizedGetFilters = getParameters.map(({ name }) => normalizeFilterName(name));
  }

  processGetFilters(filters) {
    const normalizedFilters = normalizeFilterNames(filters);
    const validFilters = this.normalizedGetFilters
      .filter((name) => name in normalizedFilters);
    const conditionals = validFilters
      .map((name) => `${this.columnNames[name]} = :${name}`)
      .join(' AND ');

    const bindParams = validFilters.reduce((params, name) => {
      params[name] = normalizedFilters[name];
      return params;
    }, {});

    return { bindParams, conditionals };
  }
}

export { GetFilterProcessor };
