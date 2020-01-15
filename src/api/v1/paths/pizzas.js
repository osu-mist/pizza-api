import { errorHandler } from 'errors/errors';
import { apiBaseUrl, resourcePathLink } from 'utils/uri-builder';

import { getPizzas, postPizza } from 'api/v1/db/oracledb/pizzas-dao';

const pizzaResourceUrl = resourcePathLink(apiBaseUrl, 'pizzas');

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
 * Create a new pizza
 *
 * @type {RequestHandler}
 * */
const post = async (req, res) => {
  try {
    const result = await postPizza(req.body);
    res.setHeader('Location', `${pizzaResourceUrl}/${result.data.id}`);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

export { get, post };
