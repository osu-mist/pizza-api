import { errorHandler } from 'errors/errors';

import { getIngredients } from 'api/v1/db/oracledb/ingredients-dao';

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
 * stub post method
 * @returns {object}
 */
const post = async () => ({
  data: {
    type: 'ingredient',
    id: 'abc123',
    links: {
      self: 'string',
    },
    attributes: {
      name: 'Sausage',
      ingredientType: 'meat',
      notes: 'brown the sausage in a pan before baking',
    },
  },
  links: {
    self: 'string',
  },
});
export { get, post };
