import _ from 'lodash';
import oracledb from 'oracledb';

import { getConnection } from 'api/v1/db/oracledb/connection';
import { serializeDough, serializeDoughs } from 'api/v1/serializers/doughs-serializer';
import { convertOutBindsToRawResource, getBindParams, outBindParamToPropertyName } from 'utils/bind-params';
import { openapi } from 'utils/load-openapi';

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
const doughColumnAliases = _.map(doughColumnNames,
  (columnName, propertyName) => `${columnName} AS "${propertyName}"`)
  .join(', ');

/**
 * A list of the columns in the DOUGH table joined by commas
 * @constant
 * @type {string}
 */
const doughColumns = _.map(doughsProperties,
  (propertyValues, property) => doughColumnNames[property])
  .join(', ');

/**
 * The full list of valid dough attributes for a POST request,
 * prepended with `:` and joined with commas
 * @constant
 * @type {string}
 */
const doughValues = _.map(doughsProperties, (propertyValues, property) => `:${property}`)
  .join(', ');

/**
 * The "out" bind params for a POST/PATCH request to DOUGHS.
 *
 * These will be "filled" with the results of creating one or more rows
 * @constant
 * @type {object}
 */
const doughsOutBindParams = _.reduce(doughsProperties,
  (outBindParams, properties, name) => {
    const bindParam = {};
    bindParam.type = properties.type === 'string' ? oracledb.STRING : oracledb.NUMBER;
    bindParam.dir = oracledb.BIND_OUT;
    outBindParams[`${name}Out`] = bindParam;
    return outBindParams;
  }, { idOut: { type: oracledb.STRING, dir: oracledb.BIND_OUT } });

/**
 * The column names referenced by the output bind params
 * used when inserting a new dough, joined with commas
 * @constant
 * @type {string}
 */
const doughsOutBindParamColumnNames = _.map(doughsOutBindParams,
  (bindParamValue, bindParamName) => doughColumnNames[outBindParamToPropertyName(bindParamName)])
  .join(', ');

/**
 * The names of the out bind params used when inserting
 * a new dough, joined with commas
 * @constant
 * @type {string}
 */
const doughsOutBindParamValues = _.map(doughsOutBindParams,
  (paramValue, paramName) => `:${paramName}`)
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
 *
 * @constant
 * @type {string}
 */
const doughsPostQuery = `INSERT INTO DOUGHS (${doughColumns}) VALUES (${doughValues})
   RETURNING ${doughsOutBindParamColumnNames} INTO ${doughsOutBindParamValues}`;

/**
 * Converts bind params to a list of column assignments for an UPDATE statement
 * written as COLUMN = :bindParam and joined with commas
 *
 * @param {object} bindParams
 * @returns {string} column assignments
 */
const doughsUpdateColumns = (bindParams) => _.map(bindParams,
  (bindParamValue, bindParamName) => `${doughColumnNames[bindParamName]} = :${bindParamName}`)
  .join(', ');

/**
 * Generates a query to update a dough record
 *
 * @param {object} bindParams
 * @returns {string}
 */
const doughsPatchQuery = (bindParams) => `UPDATE DOUGHS
  SET ${doughsUpdateColumns(bindParams)}
  WHERE ID = :id
  RETURNING ${doughsOutBindParamColumnNames} INTO ${doughsOutBindParamValues}`;

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
 * Use the data in `body` to create a new dough object.
 * @param {object} body
 * @returns {Promise<object>} a stub dough object
 */
const postDough = async (body) => {
  const bindParams = getBindParams(body, doughsProperties, doughsOutBindParams);
  const connection = await getConnection();
  try {
    const result = await connection.execute(
      doughsPostQuery,
      bindParams,
      { autoCommit: true },
    );
    const rawDough = convertOutBindsToRawResource(result.outBinds);
    return serializeDough(rawDough, 'doughs/');
  } finally {
    connection.close();
  }
};

/**
 * Get the dough from the database with id `id`
 *
 * @param {string} id
 * @returns {Promise<object>} the dough with id `id`
 */
const getDoughById = async (id) => {
  const query = doughsGetQuery('ID = :id');
  const bindParams = { id };
  const connection = await getConnection();
  try {
    const { rows } = await connection.execute(query, bindParams);
    if (rows.length === 1) return serializeDough(rows[0], `doughs/${id}`);
    if (rows.length > 1) throw new Error("database return shouldn't have multiple values");
    return null;
  } finally {
    connection.close();
  }
};

/**
 * convert object body to an UPDATE query with correct bind params
 *
 * @param {object} body a PATCH request body
 * @returns {object} `bindParams` and `query`
 */
const createPatchQueryAndBindParams = (body) => {
  const inBindParams = getBindParams(body, doughsProperties);

  const query = doughsPatchQuery(inBindParams);

  const bindParams = {
    ...inBindParams,
    ...doughsOutBindParams,
    ...{ id: body.data.id },
  };

  return { query, bindParams };
};


/**
 * Update a specific dough recipe
 *
 * @param {object} body
 * @returns {Promise<object>} the updated dough
 */
const updateDoughById = async (body) => {
  if (_.isEmpty(body.data.attributes)) return getDoughById(body.data.id);

  const { bindParams, query } = createPatchQueryAndBindParams(body);
  const connection = await getConnection();

  try {
    const result = await connection.execute(
      query,
      bindParams,
      { autoCommit: true },
    );

    if (result.rowsAffected === 0) return null;

    const rawDough = convertOutBindsToRawResource(result.outBinds);
    if (rawDough.id !== body.data.id) throw new Error('ID returned from database does not match input ID');
    return serializeDough(rawDough, `doughs/${body.data.id}`);
  } finally {
    connection.close();
  }
};

export {
  getDoughs,
  postDough,
  getDoughById,
  updateDoughById,
  doughColumnNames,
};
