import { getPizzaById, updatePizzaById } from 'api/v1/db/oracledb/pizzas-dao';
import { errorBuilder, errorHandler } from 'errors/errors';
import { ResourceNotFoundError, ResourceRelationNotFoundError } from 'utils/dao-errors';

/**
 * Get a pizza by ID
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const result = await getPizzaById(req.params.pizzaId, req.query);
    return res.send(result);
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return errorBuilder(res, '404', `No pizza with ID ${err.id} found`);
    }
    return errorHandler(res, err);
  }
};

/**
 * Update a pizza by ID
 *
 * @type {RequestHandler}
 */
const patch = async (req, res) => {
  try {
    if (req.query.pizzaId !== req.body.data.id) {
      return errorBuilder(
        res,
        '409',
        `ID ${req.params.pizzaId} in URL does not match ID ${req.body.data.id}`,
      );
    }

    const result = await updatePizzaById(req.body);

    return res.send(result);
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return errorBuilder(res, '404', `No pizza with ID ${err.id} found`);
    }

    if (err instanceof ResourceRelationNotFoundError) {
      return errorBuilder(res, '404', `Request includes invalid ${err.relation} ids`);
    }

    return errorHandler(res, err);
  }
};
/**
 * stub
 * @returns null
 */
const del = () => null;

module.exports = { get, delete: del, patch };
