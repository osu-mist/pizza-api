import { errorHandler, errorBuilder } from 'errors/errors';
import { openapi } from 'utils/load-openapi';
import { validateBody } from 'utils/validate-parameters';
import { getDoughs, postDough } from '../db/oracledb/doughs-dao';

const doughsProperties = openapi.definitions.DoughAttributes.properties;

/**
 * Get doughs
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const result = await getDoughs(req.query);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

/**
 * Post doughs
 *
 * @type {RequestHandler}
 */
const post = async (req, res) => {
  try {
    validateBody(req.body, doughsProperties);
  } catch (err) {
    return errorBuilder(res, '400', [err.message]);
  }
  try {
    const result = await postDough(req.body);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

export { get, post };
