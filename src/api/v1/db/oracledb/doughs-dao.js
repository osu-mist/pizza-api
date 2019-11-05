import _ from 'lodash';
import oracledb from 'oracledb';

import { serializeDough, serializeDoughs } from 'api/v1/serializers/doughs-serializer';
import { openapi } from 'utils/load-openapi';
import { getConnection } from './connection';

const doughsGetParameters = openapi.paths['/doughs'].get.parameters;
const doughsProperties = openapi.definitions.DoughAttributes.properties;

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
 * A list of SQL aliases mapping DOUGH table column names to DoughRecipe properties,
 * generated from the DoughColumnNames object
 *
 * @constant
 * @type {string}
 */
const doughColumnAliases = _.toPairs(doughColumnNames)
  .map(([propertyName, columnName]) => `${columnName} AS "${propertyName}"`)
  .join(', ');

/**
 * A list of the columns in the DOUGH table joined by commas
 * @constant
 * @type {string}
 */
const doughColumns = _.keys(doughsProperties)
  .map((postParam) => doughColumnNames[postParam])
  .join(', ');

/**
 * The full list of valid dough attributes for a POST request,
 * prepended with `:` and joined with commas
 * @constant
 * @type {string}
 */
const doughValues = _.keys(doughsProperties)
  .map((postParam) => `:${postParam}`)
  .join(', ');

/**
 * The "out" bind params for a POST/PATCH request to DOUGHS.
 *
 * These will be "filled" with the results of creating one or more rows
 * @constant
 * @type {object}
 */
const doughsOutBindParams = _.toPairs(doughsProperties)
  .reduce((outBindParams, [name, properties]) => {
    const bindParam = {};
    bindParam.type = properties.type === 'string' ? oracledb.STRING : oracledb.NUMBER;
    bindParam.dir = oracledb.BIND_OUT;
    outBindParams[`${name}Out`] = bindParam;
    return outBindParams;
  }, { idOut: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } });

/**
 * The column names referenced by the output bind params
 * used when inserting a new dough, joined with commas
 * @constant
 * @type {string}
 */
const doughsOutBindParamColumnNames = _.keys(doughsOutBindParams)
  .map((bindParamName) => doughColumnNames[bindParamName.slice(0, -3)])
  .join(', ');

/**
 * The names of the out bind params used when inserting
 * a new dough, joined with commas
 * @constant
 * @type {string}
 */
const doughsOutBindParamValues = _.keys(doughsOutBindParams)
  .map((paramName) => `:${paramName}`)
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
 * A query to create a new dough
 * @constant
 * @type {string}
 */
const doughsPostQuery = `INSERT INTO DOUGHS (${doughColumns}) VALUES (${doughValues}) `
  + `RETURNING ${doughsOutBindParamColumnNames} INTO ${doughsOutBindParamValues}`;

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
    const serializedDoughs = serializeDoughs(rows, filters);
    return serializedDoughs;
  } finally {
    connection.close();
  }
};

/**
 * Generate bind params from a POST body, discarding invalid
 * data attributes and adding default values for non-included attributes
 * @param {object} body
 * @returns {object} bindparams
 */
const processPostBody = (body) => {
  const { attributes } = body.data;
  const bindParams = doughsOutBindParams;
  _.toPairs(doughsProperties)
    .forEach(([paramName, paramProps]) => {
      if (paramName in attributes) {
        bindParams[paramName] = attributes[paramName];
      } else {
        bindParams[paramName] = paramProps.default;
      }
    });
  return bindParams;
};

/**
 *
 * @param {object} outBinds
 * @returns {object}
 */
const convertOutBindsToRawDough = (outBinds) => _.toPairs(outBinds)
  .reduce((rawDough, [bindName, bindValueArray]) => {
    [rawDough[bindName.slice(0, -3)]] = bindValueArray;
    return rawDough;
  }, {});

/**
 * Use the data in `body` to create a new dough object.
 * @param {object} query
 * @param {object} body
 * @returns {Promise<object>} a stub dough object
 */
const postDough = async (body) => {
  const bindParams = processPostBody(body);
  const connection = await getConnection();
  try {
    const result = await connection.execute(
      doughsPostQuery,
      bindParams,
      { autoCommit: true },
    );
    const rawDough = convertOutBindsToRawDough(result.outBinds);
    return serializeDough(rawDough, `doughs/${rawDough.id}`);
  } finally {
    connection.close();
  }
};

export { getDoughs, postDough };
