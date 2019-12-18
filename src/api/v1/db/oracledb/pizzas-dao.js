import _ from 'lodash';

import { getConnection } from 'api/v1/db/oracledb/connection';
import { doughColumnNames } from 'api/v1/db/oracledb/doughs-dao';
import { serializePizza } from 'api/v1/serializers/pizzas-serializer';
import { ingredientsColumnNames } from './ingredients-dao';

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
 * @param {Array} included
 * @returns {string}
 */
const fullPizzaQuery = (included) => `SELECT
  ${getColumnAliases(included).join(', ')}
  FROM PIZZAS 
  ${included.includes('dough') ? innerJoinDoughs : ''}
  ${included.includes('ingredients') ? innerJoinIngredients : ''}
  WHERE PIZZAS.ID = :id`;

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
 * @param {Array} rows
 * @param {Array} included
 * @returns {Array} an array of raw pizza objects
 */
const normalizePizzaRows = (rows, included) => {
  let doughsIncluded = false;
  let head;
  let ingredientsIncluded = false;
  let index = 0;
  const pizzas = [];

  if (included) {
    doughsIncluded = included.includes('dough');
    ingredientsIncluded = included.includes('ingredients');
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
 * Fetch the pizza with ID `pizzaId`
 *
 * @param {string} pizzaId
 * @param {object} query Query parameters for the request
 * @returns {Promise<object>} the full pizza record
 */
const getPizzaById = async (pizzaId, query) => {
  const included = _.get(query, 'includes', []);
  const bindParams = { id: pizzaId };
  const connection = await getConnection();
  try {
    console.log(fullPizzaQuery(included));
    const { rows } = await connection.execute(fullPizzaQuery(included), bindParams);

    const pizzas = normalizePizzaRows(rows, included);

    if (pizzas.length === 0) return null;

    return serializePizza(pizzas[0], `pizzas/${pizzaId}`);
  } finally {
    connection.close();
  }
};

export { getPizzaById };
