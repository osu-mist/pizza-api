import { getPizzaById } from 'api/v1/db/oracledb/pizzas-dao';
import { errorHandler } from 'errors/errors';

/**
 * Get a pizza by ID
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const result = await getPizzaById(req.params.pizzaId);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

/**
 * stub
 * @returns null
 */
const patch = () => null;
/**
 * stub
 * @returns null
 */
const del = () => null;

module.exports = { get, delete: del, patch };
