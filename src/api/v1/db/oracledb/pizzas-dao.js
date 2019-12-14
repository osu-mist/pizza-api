import _ from 'lodash';

import { getConnection } from 'api/v1/db/oracledb/connection';
import { getDoughById } from 'api/v1/db/oracledb/doughs-dao';
import { serializePizza } from 'api/v1/serializers/pizzas-serializer';

const pizzaColumns = {
  id: 'ID',
  doughId: 'DOUGH_ID',
  name: 'NAME',
  bakeTime: 'BAKE_TIME',
  ovenTemp: 'OVEN_TEMP',
  specialInstructions: 'SPECIAL_INSTRUCTIONS',
};

const pizzaColumnAliases = _.map(pizzaColumns,
  (columnName, attributeName) => `${columnName} AS "${attributeName}"`)
  .join(', ');

/**
 * Fetch all the ingredients associated with the pizza with id
 *  `pizzaId`
 *
 * @param {string} pizzaId
 * @returns {Array} an array of unserialized ingredient objects
 */
const getPizzaIngredients = async (pizzaId) => {
  const query = 'SELECT INGREDIENTS.ID AS "id", INGREDIENTS.TYPE AS "ingredientType", INGREDIENTS.NAME as "name", INGREDIENTS.NOTES AS "notes" FROM PIZZA_INGREDIENTS INNER JOIN INGREDIENTS ON PIZZA_INGREDIENTS.INGREDIENT_ID = INGREDIENTS.ID WHERE PIZZA_INGREDIENTS.PIZZA_ID = :id';
  const bindParams = { id: pizzaId };
  const connection = await getConnection();
  try {
    const result = await connection.execute(
      query,
      bindParams,
    );
    return result.rows;
  } finally {
    connection.close();
  }
};

/**
 * Get a "deserialized" dough object using `getDoughById`
 *
 * @param {string} doughId the ID of the dough to get
 * @returns {object} a raw dough object
 */
const getPizzaDough = async (doughId) => {
  const serializedDough = await getDoughById(doughId);

  if (serializedDough === null) return {};

  const deserializedDough = {
    id: serializedDough.data.id,
    ...serializedDough.data.attributes,
  };
  return deserializedDough;
};

const getPizzaByIdQuery = `SELECT ${pizzaColumnAliases} FROM PIZZAS WHERE ID = :id`;
/**
 * Fetch the pizza with ID `pizzaId`
 *
 * @param {string} pizzaId
 * @returns {Promise<object>} the full pizza record
 */
const getPizzaById = async (pizzaId) => {
  const bindParams = { id: pizzaId };
  const connection = await getConnection();
  try {
    const { rows } = await connection.execute(getPizzaByIdQuery, bindParams);

    if (rows.length > 1) throw new Error('Returned multiple outputs for the same ID');
    if (rows.length === 0) return null;

    const { doughId } = rows[0];

    const dough = await getPizzaDough(doughId);
    const ingredients = await getPizzaIngredients(pizzaId);

    const rawPizza = {
      dough,
      ingredients,
      ...rows[0],
    };

    return serializePizza(rawPizza, `pizzas/${pizzaId}`);
  } finally {
    connection.close();
  }
};

export { getPizzaById };
