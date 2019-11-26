import { apiBaseUrl, resourcePathLink } from 'utils/uri-builder';
import { errorHandler } from 'errors/errors';

import { getIngredients, postIngredient } from 'api/v1/db/oracledb/ingredients-dao';

const ingredientResourceUrl = resourcePathLink(apiBaseUrl, 'ingredients');

/**
 * GET ingredients
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const result = await getIngredients(req.query);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

/**
 * POST ingredients
 *
 * @type {RequestHandler}
 */
const post = async (req, res) => {
  try {
    const result = await postIngredient(req.body);
    res.setHeader('Location', `${ingredientResourceUrl}/${result.data.id}`);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};
export { get, post };
