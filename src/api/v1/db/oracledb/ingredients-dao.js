import _ from 'lodash';
import oracledb from 'oracledb';

import { getConnection } from 'api/v1/db/oracledb/connection';
import { serializeIngredients, serializeIngredient } from 'api/v1/serializers/ingredients-serializer';
import { openapi } from 'utils/load-openapi';
import { GetFilterProcessor } from 'utils/process-get-filters';


const ingredientsGetParameters = openapi.paths['/ingredients'].get.parameters;
const ingredientsProperties = openapi.definitions.IngredientAttributes.properties;

const ingredientsColumnNames = {
  id: 'ID',
  ingredientType: 'TYPE',
  name: 'NAME',
  notes: 'NOTES',
};

/**
 * convert an output bind param name like `nameOut` to a
 * property name like `name` by removing 'Out' at the end of the string
 *
 * @param {string} outBindParamName
 * @returns {string} the property name
 */
const outBindParamToPropertyName = (outBindParamName) => {
  const outBindEndRegex = /(.*)Out$/;
  const regexResults = outBindEndRegex.exec(outBindParamName);
  return regexResults ? regexResults[1] : outBindParamName;
};

/**
 * A list of the columns in the INGREDIENTS table joined by commas
 *
 * @constant
 * @type {string}
 */
const ingredientColumns = _.map(ingredientsProperties,
  (propertyValues, property) => ingredientsColumnNames[property])
  .join(', ');

/**
 * The full list of valid ingredient attributes for a POST request,
 * prepended with `:` and joined with commas
 *
 * @constant
 * @type {string}
 */
const ingredientValues = _.map(ingredientsProperties, (propertyValues, property) => `:${property}`)
  .join(', ');

/**
 * The "out" bind params for a POST/PATCH request to INGREDIENTS.
 * These will be "filled" with the results of creating one or more rows
 *
 * @constant
 * @type {object}
 */
const ingredientsOutBindParams = _.reduce(ingredientsProperties,
  (outBindParams, properties, name) => {
    const bindParam = {};
    bindParam.type = properties.type === 'string' ? oracledb.STRING : oracledb.NUMBER;
    bindParam.dir = oracledb.BIND_OUT;
    outBindParams[`${name}Out`] = bindParam;
    return outBindParams;
  }, { idOut: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } });

/**
 * The column names referenced by the output bind params
 * used when inserting a new ingredient, joined with commas
 *
 * @constant
 * @type {string}
 */
const ingredientsOutBindParamColumnNames = _.map(ingredientsOutBindParams,
  (bindParamValue, bindParamName) => ingredientsColumnNames[
    outBindParamToPropertyName(bindParamName)
  ])
  .join(', ');

/**
 * The names of the out bind params used when inserting
 * a new ingredient, joined with commas
 *
 * @constant
 * @type {string}
 */
const ingredientsOutBindParamValues = _.map(ingredientsOutBindParams,
  (paramValue, paramName) => `:${paramName}`)
  .join(', ');

/**
 * SQL aliases for mapping INGREDIENTS column names to
 * IngredientResource property names
 *
 * @const {string}
 */
const ingredientColumnAliases = _.map(ingredientsColumnNames,
  (columnName, propertyName) => `${columnName} AS "${propertyName}"`)
  .join(', ');

/**
 * A filter processor object initialized for processing ingredient filters
 *
 * @const {GetFilterProcessor}
 */
const filterProcessor = new GetFilterProcessor(ingredientsGetParameters, ingredientsColumnNames);

/**
 * Generate a SELECT query using `conditionals`
 *
 * @param {string} conditionals
 * @returns {string} a select query
 */
const getIngredientsQuery = (conditionals) => `SELECT ${ingredientColumnAliases} FROM INGREDIENTS ${conditionals ? `WHERE ${conditionals}` : ''}`;

const postIngredientsQuery = `INSERT INTO INGREDIENTS (${ingredientColumns}) VALUES (${ingredientValues})
  RETURNING ${ingredientsOutBindParamColumnNames} INTO ${ingredientsOutBindParamValues}`;

/**
 * Get ingredients from the database
 *
 * @param {object} filters
 * @returns {Promise<object[]>} Promise object representing a list of ingredients
 */
const getIngredients = async (filters) => {
  const { bindParams, conditionals } = filterProcessor.processGetFilters(filters);
  const query = getIngredientsQuery(conditionals);
  const connection = await getConnection();
  try {
    const { rows } = await connection.execute(query, bindParams);
    return serializeIngredients(rows, filters);
  } finally {
    connection.close();
  }
};

/**
 * Generate bind params from a POST body, assuming invalid attributes
 * have been removed and non-included values have been substituted for their
 * defaults
 *
 * @param {object} body
 * @returns {object} bindparams
 * @throws {Error} when an attribute not in ingredientsProperties is found in body.
 * It's assumed that body has already been checked for invalid properties meaning that when
 * one is found here it's a server error rather than a user error.
 */
const getPostBindParams = (body) => {
  const { attributes } = body.data;
  const bindParams = ingredientsOutBindParams;
  _.forEach(attributes, (attributeValue, attributeName) => {
    if (!(attributeName in ingredientsProperties)) {
      throw new Error('Invalid attribute found');
    }
    bindParams[attributeName] = attributeValue;
  });
  return bindParams;
};

/**
 * Converts the return value of a SQL query that uses
 * `RETURNS ... INTO ...` into the format of the return
 * from a `SELECT` query to it can be passed directly to
 * `serializeIngredient`.
 *
 * @param {object} outBinds
 * @returns {object}
 */
const convertOutBindsToRawIngredient = (outBinds) => _.reduce(outBinds,
  (rawIngredient, bindValueArray, bindName) => {
    [rawIngredient[outBindParamToPropertyName(bindName)]] = bindValueArray;
    return rawIngredient;
  }, {});

/**
 * Use the data in `body` to create a new ingredient object.
 *
 * @param {object} body
 * @returns {Promise<object>} an ingredient object
 */
const postIngredient = async (body) => {
  const bindParams = getPostBindParams(body);
  const connection = await getConnection();
  try {
    const result = await connection.execute(
      postIngredientsQuery,
      bindParams,
      { autoCommit: true },
    );
    const rawIngredient = convertOutBindsToRawIngredient(result.outBinds);
    return serializeIngredient(rawIngredient);
  } finally {
    connection.close();
  }
};

export { getIngredients, postIngredient };
