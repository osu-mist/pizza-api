import dedent from 'dedent';
import _ from 'lodash';

import { getConnection } from 'api/v1/db/oracledb/connection';
import { doughColumnNames } from 'api/v1/db/oracledb/doughs-dao';
import { openapi } from 'utils/load-openapi';
import { serializePizza, serializePizzas } from 'api/v1/serializers/pizzas-serializer';
import { GetFilterProcessor } from 'utils/process-get-filters';

import { ingredientsColumnNames } from './ingredients-dao';

const pizzaGetParameters = openapi.paths['/pizzas'].get.parameters;

/**
 * A list of the names of query filters used in GET /pizzas
 *
 * @const
 * @type {string[]}
 */
const pizzaFilters = _.map(pizzaGetParameters, (parameter) => parameter.name);

const pizzaColumns = {
  id: 'ID',
  doughId: 'DOUGH_ID',
  name: 'NAME',
  bakeTime: 'BAKE_TIME',
  ovenTemp: 'OVEN_TEMP',
  specialInstructions: 'SPECIAL_INSTRUCTIONS',
};

/**
 * Transform a resource with name `resourceName` and
 * table `resourceTableName` into an array of strings written as
 * `TABLENAME.COLUMNAME = "RESOURCENAME_attributeName"
 *
 * @param {string} resourceName
 * @param {string} resourceTableName
 * @param {object} resourceColumns
 * @returns {object[]}
 */
const resourceColumnAliases = (
  resourceName,
  resourceTableName,
  resourceColumns,
) => _.map(resourceColumns,
  (columnName, attributeName) => `${resourceTableName}.${columnName} AS "${resourceName}_${attributeName}"`);

/**
 * Returns a list of column aliases for pizzas, and, optionally,
 * doughs and ingredients based on the values in `included`
 *
 * @param {string[]} included
 * @returns {string[]}
 */
const getColumnAliases = (included) => {
  const columns = resourceColumnAliases('PIZZA', 'PIZZAS', pizzaColumns);

  if (included.includes('dough')) {
    columns.push(
      ...resourceColumnAliases('DOUGH', 'DOUGHS', doughColumnNames),
    );
  }
  if (included.includes('ingredients')) {
    columns.push(
      ...resourceColumnAliases('INGREDIENT', 'INGREDIENTS', ingredientsColumnNames),
    );
  }

  return columns;
};

const innerJoinDoughs = 'LEFT JOIN DOUGHS ON PIZZAS.DOUGH_ID = DOUGHS.ID';

const innerJoinIngredients = `LEFT JOIN PIZZA_INGREDIENTS ON PIZZAS.ID = PIZZA_INGREDIENTS.PIZZA_ID
  LEFT JOIN INGREDIENTS ON INGREDIENTS.ID = PIZZA_INGREDIENTS.INGREDIENT_ID`;
/**
 * A query to fetch a pizza with, optionally, its ingredients and doughs
 *
 * @param {string[]} included
 * @param {string} conditionals
 * @returns {string}
 */
const getPizzaByIdQuery = (included, conditionals) => dedent`SELECT ${getColumnAliases(included).join(',\n    ')}
  FROM PIZZAS
  ${included.includes('dough') ? innerJoinDoughs : ''}
  ${included.includes('ingredients') ? innerJoinIngredients : ''}
  ${conditionals ? `WHERE ${conditionals}` : ''}`;

/**
 * get conditionals and bind params for a SELECT query
 * to get multiple pizzas from the database
 *
 * @param {object} query the query parameters passed to the HTTP request
 * @returns {object} `bindParams` (object) and `conditionals` (string)
 */
const getConditionalsAndBindParams = (query) => {
  const conditionalStatements = [];
  const bindParams = {};
  _.forEach(query, (parameterValue, parameterName) => {
    if (pizzaFilters.includes(parameterName)
      && parameterName.match(/filter\[.*\]/)) {
      const normalizedFilterName = GetFilterProcessor.normalizeFilterName(parameterName);
      conditionalStatements.push(`PIZZAS.${pizzaColumns[normalizedFilterName]} = :${normalizedFilterName}`);
      bindParams[normalizedFilterName] = parameterValue;
    }
  });
  const conditionals = conditionalStatements.join(', ');
  return { conditionals, bindParams };
};

/**
 * Extracts resource attributes from a row object with
 * column names formatted like RESOURCENAME_attributeName
 * for a resource with name `resourceName` and attributes `resourceAttributes`
 *
 * @param {string} resourceName should be written in all caps
 * @param {object} resourceAttributes
 * @param {object} row
 * @returns {object}
 */
const extractRawResource = (resourceName, resourceAttributes, row) => {
  if (row[`${resourceName}_id`] === null) return null;
  const rawResource = {};
  _.keys(resourceAttributes).forEach(
    (attributeName) => {
      rawResource[attributeName] = row[`${resourceName}_${attributeName}`];
    },
  );
  return rawResource;
};

/**
 * Turn raw database output from `fullPizzaQuery` into
 * an array of raw dough objects with doughs and ingredients
 *
 * @param {object[]} rows
 * @returns {object[]} an array of raw pizza objects
 */
const normalizePizzaRows = (rows) => {
  let doughsIncluded = false;
  let head;
  let ingredientsIncluded = false;
  let index = 0;
  const pizzas = [];

  if (rows[0]) {
    doughsIncluded = 'DOUGH_id' in rows[0];
    ingredientsIncluded = 'INGREDIENT_id' in rows[0];
  }

  while (index < rows.length) {
    head = rows[index];
    const pizza = extractRawResource('PIZZA', pizzaColumns, head);

    if (doughsIncluded) {
      const dough = extractRawResource('DOUGH', doughColumnNames, head);
      pizza.dough = dough || {};
    }

    if (ingredientsIncluded) {
      pizza.ingredients = [];
      while (index < rows.length && rows[index].PIZZA_id === head.PIZZA_id) {
        const ingredient = extractRawResource('INGREDIENT', ingredientsColumnNames, rows[index]);
        if (ingredient) pizza.ingredients.push(ingredient);
        index += 1;
      }
    } else {
      index += 1;
    }
    pizzas.push(pizza);
  }
  return pizzas;
};

/**
 * get all pizzas from the database
 *
 * @param {object} query
 * @returns {Promise<object>} the serialized pizza
 */
const getPizzas = async (query) => {
  const included = _.get(query, 'include', []);
  const { conditionals, bindParams } = getConditionalsAndBindParams(query);
  const selectQuery = getPizzaByIdQuery(included, conditionals);
  const connection = await getConnection();
  try {
    const { rows } = await connection.execute(selectQuery, bindParams);
    const pizzas = normalizePizzaRows(rows);
    return serializePizzas(pizzas, query);
  } finally {
    connection.close();
  }
};

/**
 * Fetch the pizza with ID `pizzaId`
 *
 * @param {string} pizzaId
 * @param {object} query Query parameters for the request
 * @returns {Promise<object>} the full pizza record
 */
const getPizzaById = async (pizzaId, query) => {
  const included = _.get(query, 'include', []);
  const bindParams = { id: pizzaId };
  const connection = await getConnection();
  try {
    const { rows } = await connection.execute(getPizzaByIdQuery(included, 'PIZZAS.ID = :id'), bindParams);

    const pizzas = normalizePizzaRows(rows);

    if (pizzas.length === 0) return null;

    return serializePizza(pizzas[0], `pizzas/${pizzaId}`);
  } finally {
    connection.close();
  }
};

export { getPizzas, getPizzaById };
