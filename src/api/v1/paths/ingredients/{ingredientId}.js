import { getIngredientById } from 'api/v1/db/oracledb/ingredients-dao';
import { errorBuilder, errorHandler } from 'errors/errors';

/**
 * Get a single ingredient with ID `ingredientId`
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const result = await getIngredientById(req.params.ingredientId);
    if (!result) {
      return errorBuilder(res, '404', `No ingredient with ID ${req.params.ingredientId} exists`);
    }
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

/**
 * Update an ingredient with ID `ingredientId` (stub)
 *
 * @type {RequestHandler}
 */
const patch = () => null;

export {
  get, patch,
};
