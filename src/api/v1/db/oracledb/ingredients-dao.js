import _ from 'lodash';

import { getConnection } from 'api/v1/db/oracledb/connection';
import { serializeIngredients } from 'api/v1/serializers/ingredients-serializer';
import { openapi } from 'utils/load-openapi';
import { GetFilterProcessor } from 'utils/process-get-filters';


const ingredientsGetParameters = openapi.paths['/ingredients'].get.parameters;

const ingredientsColumnNames = {
  id: 'ID',
  ingredientType: 'TYPE',
  name: 'NAME',
  notes: 'NOTES',
};

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

export { getIngredients };
