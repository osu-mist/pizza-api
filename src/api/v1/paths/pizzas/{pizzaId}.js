import { getPizzaById } from 'api/v1/db/oracledb/pizzas-dao';
import { errorBuilder, errorHandler } from 'errors/errors';

/**
 * Get a pizza by ID
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const result = await getPizzaById(req.params.pizzaId);
    if (result === null) {
      return errorBuilder(res, '404', `No pizza with ID ${req.params.pizzaId} found`);
    }
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
