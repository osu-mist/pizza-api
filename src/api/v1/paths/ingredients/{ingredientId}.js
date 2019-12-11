import { getIngredientById, updateIngredientById } from 'api/v1/db/oracledb/ingredients-dao';
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
const patch = async (req, res) => {
  try {
    if (req.params.ingredientId !== req.body.data.id) {
      return errorBuilder(
        res,
        '409',
        `ID ${req.params.ingredientId} in URL does not match ID ${req.body.data.id} in body`,
      );
    }
    const result = await updateIngredientById(req.body);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

export { get, patch };
