import config from 'config';
import _ from 'lodash';

import { serializeDoughs } from 'api/v1/serializers/doughs-serializer';
import { openapi } from 'utils/load-openapi';
import { getConnection } from './connection';

const { endpointUri } = config.get('server');
const doughsGetParameters = openapi.paths['/doughs'].get.parameters;

/**
 * An object mapping DoughRecipe property names to DOUGH table column names
 *
 * @constant
 * @type {object}
 */
const doughColumnNames = {
  id: 'ID',
  name: 'NAME',
  gramsFlour: 'GRAMS_FLOUR',
  gramsWater: 'GRAMS_WATER',
  flourType: 'FLOUR_TYPE',
  waterTemp: 'WATER_TEMP',
  gramsYeast: 'GRAMS_YEAST',
  gramsSalt: 'GRAMS_SALT',
  gramsSugar: 'GRAMS_SUGAR',
  gramsOliveOil: 'GRAMS_OLIVE_OIL',
  bulkFermentTime: 'BULK_FERMENT_TIME',
  proofTime: 'PROOF_TIME',
  specialInstructions: 'SPECIAL_INSTRUCTIONS',
};

/**
 * a list of SQL aliases mapping DOUGH table column names to DoughRecipe properties,
 * generated from the DoughColumnNames object
 *
 * @constant
 * @type {string}
 */
const doughColumnAliases = _.toPairs(doughColumnNames)
  .map(([propertyName, columnName]) => `${columnName} AS "${propertyName}"`)
  .join(', ');

/**
 * Turns a string containing conditional statements like `NAME = :name AND WATER_TEMP = :waterTemp`
 * into a fully fledged sql statement
 *
 * @param {string} conditionals
 * @returns {string} The assembled query
 */
const doughsGetQuery = (conditionals) => `SELECT ${doughColumnAliases} FROM DOUGHS ${conditionals ? `WHERE ${conditionals}` : ''}`;


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

const normalizedDoughsGetFilters = doughsGetParameters
  .map(({ name }) => normalizeFilterName(name));

/**
 * Transforms a filters object with arbitrary params into a string of conditionals
 * like NAME = :name and an object with the values of the corresponding bind
 * parameters, like { name: "Test dough" }
 *
 * @param {string[]} filters
 * @returns {object} bindParams and Conditionals
 */
const processGetFilters = (filters) => {
  const normalizedFilters = normalizeFilterNames(filters);
  const validFilters = normalizedDoughsGetFilters
    .filter((name) => name in normalizedFilters);
  const conditionals = validFilters
    .map((name) => `${doughColumnNames[name]} = :${name}`)
    .join(' AND ');

  const bindParams = validFilters.reduce((params, name) => {
    params[name] = normalizedFilters[name];
    return params;
  }, {});

  return { bindParams, conditionals };
};

/**
 * Return a list of doughs filtered according to `filters`. See API docs.
 *
 * @param {object} filters
 * @returns {Promise<object[]>} Promise object represents a list of doughs
 */
const getDoughs = async (filters) => {
  const { bindParams, conditionals } = processGetFilters(filters);
  const query = doughsGetQuery(conditionals);
  const connection = await getConnection();
  try {
    const { rows } = await connection.execute(query, bindParams);
    const serializedDoughs = serializeDoughs(rows, endpointUri);
    return serializedDoughs;
  } finally {
    connection.close();
  }
};

/**
 *
 * @param {Array} queries
 * @returns {Promise<object>} a stub dough object
 */
const postDough = async () => (
  {
    data: {
      type: 'dough',
      id: 'abc123',
      links: {
        self: 'string',
      },
      attributes: {
        name: 'weeknight pizza dough',
        gramsFlour: 500,
        flourType: 'All Purpose',
        gramsWater: 400,
        waterTemp: 90,
        gramsYeast: 5,
        gramsSalt: 15,
        gramsSugar: 20,
        gramsOliveOil: 50,
        bulkFermentTime: 60,
        proofTime: 15,
        specialInstructions: 'keep the dough in the fridge during the bulk ferment',
      },
    },
    links: {
      self: 'string',
    },
  }
);

export { getDoughs, postDough };
