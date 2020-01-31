import { errorBuilder, errorHandler } from 'errors/errors';
import { apiBaseUrl, resourcePathLink } from 'utils/uri-builder';

import { getPizzas, postPizza } from 'api/v1/db/oracledb/pizzas-dao';
import { ResourceRelationNotFoundError } from '../../../utils/dao-errors';

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
    if (result === null) {
      return errorBuilder(res, '404', 'Invalid ID requested for a relationship');
    }
    res.setHeader('Location', `${pizzaResourceUrl}/${result.data.id}`);
    return res.send(result);
  } catch (err) {
    if (err instanceof ResourceRelationNotFoundError) {
      return errorBuilder(res, '404', `Request includes invalid ${err.relation} ids`);
    }
    return errorHandler(res, err);
  }
};

export { get, post };
