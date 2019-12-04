// import _ from 'lodash';

import { getDoughById } from 'api/v1/db/oracledb/doughs-dao';
import { errorBuilder, errorHandler } from 'errors/errors';

/**
 * Get a dough with id `req.params.doughId`
 *
 * @type {RequestHandler}
 */
const get = async (req, res) => {
  try {
    const result = await getDoughById(req.params.doughId);
    if (!result) {
      return errorBuilder(res, '404', `No dough with ID ${req.params.doughId} exists`);
    }
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

/**
 * stub of patch function
 *
 * @returns null
 */
const patch = async () => null;

export { get, patch };
