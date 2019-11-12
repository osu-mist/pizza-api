import _ from 'lodash';

class GetFilterProcessor {
  /**
   * Returns filters with keys changed to remove the "filter[]" wrapper
   *
   * @param {object} filters
   * @returns {object}
   */
  static normalizeFilterNames(filters) {
    return _.mapKeys(filters,
      (filterValue, filterName) => GetFilterProcessor.normalizeFilterName(filterName));
  }

  /**
   * Removes the "filter[]" wrapper from a filter parameter
   *
   * @param {string} filterName
   * @returns {string} the filter name with 'filter' and brackets removed
   */
  static normalizeFilterName(filterName) {
    const filterTextRegex = /filter\[(.*)\]/g;
    const regexResults = filterTextRegex.exec(filterName);
    return regexResults[1] || filterName;
  }

  /**
   * Initializes a new filter process using the parameters from the
   * get request for the resource and a map of column names to resource attribute names
   *
   * @param {Array} getParameters
   * @param {object} columnNames
   */
  constructor(getParameters, columnNames) {
    this.getParameters = getParameters;
    this.columnNames = columnNames;
    this.normalizedGetFilters = getParameters.map(
      ({ name }) => GetFilterProcessor.normalizeFilterName(name),
    );
  }

  /**
   * Processes filters based on getParameters and columnNames
   * into a string of `conditionals` like `NAME = :name AND TYPE = :type`
   * and bind params like `{name: 'john', type: 'student'}`
   * @param {object} filters
   * @returns {object}
   */
  processGetFilters(filters) {
    const normalizedFilters = GetFilterProcessor.normalizeFilterNames(filters);
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
