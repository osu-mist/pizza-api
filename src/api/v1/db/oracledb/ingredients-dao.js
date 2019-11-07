import _ from 'lodash';
import { openapi } from 'utils/load-openapi';
import { serializeIngredients } from 'api/v1/serializers/ingredients-serializer';
import { getConnection } from './connection';


const ingredientsGetParameters = openapi.paths['/ingredients'].get.parameters;

const ingredientsColumnNames = {
  id: 'ID',
  ingredientType: 'TYPE',
  name: 'NAME',
  notes: 'NOTES',
};

const ingredientColumnAliases = _.map(ingredientsColumnNames,
  (columnName, propertyName) => `${columnName} AS "${propertyName}"`)
  .join(', ');

/**
 * generate a SELECT query using `conditionals`
 * @param {string} conditionals
 * @returns {string} a select query
 */
const getIngredientsQuery = (conditionals) => `SELECT ${ingredientColumnAliases} FROM INGREDIENTS ${conditionals ? `WHERE ${conditionals}` : ''}`;

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

const normalizedIngredientsGetFilters = ingredientsGetParameters
  .map(({ name }) => normalizeFilterName(name));

/**
 * Transforms a filters object with arbitrary params into a string of conditionals
 * like NAME = :name and an object with the values of the corresponding bind
 * parameters, like { name: "Sausage" }
 *
 * @param {string[]} filters
 * @returns {object} bindParams and Conditionals
 */
const processGetFilters = (filters) => {
  const normalizedFilters = normalizeFilterNames(filters);
  const validFilters = normalizedIngredientsGetFilters
    .filter((name) => name in normalizedFilters);
  const conditionals = validFilters
    .map((name) => `${ingredientsColumnNames[name]} = :${name}`)
    .join(' AND ');

  const bindParams = validFilters.reduce((params, name) => {
    params[name] = normalizedFilters[name];
    return params;
  }, {});

  return { bindParams, conditionals };
};

/**
 * Get ingredients from the database
 * @param {object} filters
 * @returns {Promise<object[]>} Promise object representing a list of ingredients
 */
const getIngredients = async (filters) => {
  const { bindParams, conditionals } = processGetFilters(filters);
  const query = getIngredientsQuery(conditionals);
  const connection = await getConnection();
  try {
    const { rows } = await connection.execute(query, bindParams);
    return serializeIngredients(rows, filters);
  } finally {
    connection.close();
  }
};

export { getIngredients };
