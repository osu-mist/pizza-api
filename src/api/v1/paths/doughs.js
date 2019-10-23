import { errorHandler } from 'errors/errors';
import { getDoughs, postDough } from '../db/oracledb/doughs-dao';

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
    const result = await postDough(req.query);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

export { get, post };
