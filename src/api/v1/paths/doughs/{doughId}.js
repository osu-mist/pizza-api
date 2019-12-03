import { getDoughById, updateDoughById } from 'api/v1/db/oracledb/doughs-dao';
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
 * Update a dough with the ID specified in the request body
 *
 * @type {RequestHandler}
 */
const patch = async (req, res) => {
  try {
    if (req.params.doughId !== req.body.data.id) {
      return errorBuilder(
        res,
        '409',
        `ID ${req.params.doughId} in URL parameter does not match ID ${req.body.data.id} in body`,
      );
    }
    const result = await updateDoughById(req.body);
    return res.send(result);
  } catch (err) {
    return errorHandler(res, err);
  }
};

export { get, patch };
