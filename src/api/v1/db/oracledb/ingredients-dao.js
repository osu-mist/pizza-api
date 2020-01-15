import _ from 'lodash';
import oracledb from 'oracledb';

import { getConnection } from 'api/v1/db/oracledb/connection';
import { serializeIngredients, serializeIngredient } from 'api/v1/serializers/ingredients-serializer';
import { convertOutBindsToRawResource, getBindParams, outBindParamToPropertyName } from 'utils/bind-params';
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
  }, { idOut: { type: oracledb.STRING, dir: oracledb.BIND_OUT } });

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
 * Convert bind params to a list of column assignments for an UPDATE
 * statement
 *
 * @param {object} bindParams
 * @returns {string}
 */
const ingredientsUpdateColumns = (bindParams) => _.map(bindParams,
  (bindParamValue, bindParamName) => `${ingredientsColumnNames[bindParamName]} = :${bindParamName}`)
  .join(', ');

/**
 * Return an UPDATE query to update the attributes in
 * `bindParams`
 *
 * @param {object} bindParams
 * @returns {string} the assembled query
 */
const ingredientsPatchQuery = (bindParams) => `UPDATE INGREDIENTS
  SET ${ingredientsUpdateColumns(bindParams)}
  WHERE ID = :id
  RETURNING ${ingredientsOutBindParamColumnNames} INTO ${ingredientsOutBindParamValues}`;
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
 * Use the data in `body` to create a new ingredient object.
 *
 * @param {object} body
 * @returns {Promise<object>} an ingredient object
 */
const postIngredient = async (body) => {
  const bindParams = getBindParams(body, ingredientsProperties, ingredientsOutBindParams);
  const connection = await getConnection();
  try {
    const result = await connection.execute(
      postIngredientsQuery,
      bindParams,
      { autoCommit: true },
    );
    const rawIngredient = convertOutBindsToRawResource(result.outBinds);
    return serializeIngredient(rawIngredient, 'ingredients');
  } finally {
    connection.close();
  }
};

/**
 * Get a single ingredient with ID `id` from the database
 *
 * @param {string} id
 * @returns {Promise<object>} the ingredient with ID `id`
 */
const getIngredientById = async (id) => {
  const query = getIngredientsQuery('ID = :id');
  const bindParams = { id };
  const connection = await getConnection();
  try {
    const { rows } = await connection.execute(query, bindParams);
    if (rows.length > 1) throw new Error("database return shouldn't have multiple rows");
    if (rows.length === 0) return null;
    return serializeIngredient(rows[0], `ingredients/${id}`);
  } finally {
    connection.close();
  }
};

/**
 * convert object body into an UPDATE query with the correct bind params
 *
 * @param {object} body a PATCH request body
 * @returns {object} bind params and query
 */
const createPatchQueryAndBindParams = (body) => {
  const inBindParams = getBindParams(body, ingredientsProperties);


  const query = ingredientsPatchQuery(inBindParams);

  const bindParams = {
    ...inBindParams,
    ...ingredientsOutBindParams,
    id: body.data.id,
  };

  return { query, bindParams };
};

/**
 * update an ingredient with ID `body.data.id` using
 * `body.data.attributes`
 *
 * @param {object} body
 * @returns {Promise<object>} the updated ingredient
 */
const updateIngredientById = async (body) => {
  if (_.isEmpty(body.data.attributes)) return getIngredientById(body.data.id);

  const { query, bindParams } = createPatchQueryAndBindParams(body);
  const connection = await getConnection();
  try {
    const result = await connection.execute(
      query,
      bindParams,
      { autoCommit: true },
    );

    if (result.rowsAffected === 0) return null;

    const rawIngredient = convertOutBindsToRawResource(result.outBinds);
    if (rawIngredient.id !== body.data.id) throw new Error('ID returned from database does not match input ID');
    return serializeIngredient(rawIngredient, `ingredients/${body.data.id}`);
  } finally {
    connection.close();
  }
};
export {
  getIngredients,
  postIngredient,
  getIngredientById,
  updateIngredientById,
  ingredientsColumnNames,
};
