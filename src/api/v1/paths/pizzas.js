import { getPizzas } from 'api/v1/db/oracledb/pizzas-dao';
import { errorHandler } from 'errors/errors';

/**
 *
 * @type {RequestHandler}
 * */
const get = async (req, res) => {
  try {
    const result = await getPizzas(req.query);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

/**
 * stub
 * @returns {object}
 * */
const post = () => ({});

export { get, post };
