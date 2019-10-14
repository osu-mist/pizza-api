import config from 'config';
import _ from 'lodash';

import { serializeDoughs } from 'api/v1/serializers/doughs-serializer';
import { openapi } from 'utils/load-openapi';
import { getConnection } from './connection';

const { endpointUri } = config.get('server');
const doughsGetParameters = openapi.paths['/doughs'].get.parameters;

/**
 * @constant
 * @type {object}
 * @description an object mapping DoughRecipe property names to DOUGH table column names
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
 * @constant
 * @type {string}
 * @description a list of SQL aliases mapping DOUGH table column names to DoughRecipe properties,
 *              generated from the DoughColumnNames object
 */
const doughColumnAliases = _.toPairs(doughColumnNames)
  .map(([propertyName, columnName]) => `${columnName} AS "${propertyName}"`)
  .join(', ');

/**
 *
 * @param {string} filters
 * @returns {string} The assembled query
 */
const doughsGetQuery = (filters) => `SELECT ${doughColumnAliases} FROM DOUGHS ${filters.length > 0 ? 'WHERE' : ''} ${filters}`;

/**
 *
 * @param {string} filterName
 * @returns {string} the filter name with 'filter' and brackets removed
 */
const filterToPropertyName = (filterName) => filterName.replace(/filter|\[|\]/g, '');

/**
 * @param {Array<string>} filters
 * @returns {object} bindParams and Conditionals
 */
const processGetFilters = (filters) => {
  const validFilters = doughsGetParameters.filter((filter) => filter.name in filters);
  const conditionals = validFilters
    .map((filter) => {
      const propertyName = filterToPropertyName(filter.name);
      return `${doughColumnNames[propertyName]} = :${propertyName}`;
    })
    .join(' AND ');

  const bindParams = validFilters.reduce((params, filter) => {
    params[filterToPropertyName(filter.name)] = filters[filter.name];
    return params;
  }, {});

  return { bindParams, conditionals };
};

/**
 * Return a list of doughs
 *
 * @param {Array} filters
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
const createDough = async () => (
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

export { getDoughs, createDough };
