import { getConnection } from 'api/v1/db/oracledb/connection';

/**
 *
 * @param {withConnectionClosure} closure must be an async function
 * @returns {*} the result of calling `closure` with a new `connection` object
 */
const withConnection = async (closure) => {
  const connection = await getConnection();
  return closure(connection).finally(() => connection.close());
};

/**
 *
 * @callback withConnectionClosure
 * @param {object} connection an oracleDB connection
 * @returns {Promise<object>}
 */


export { withConnection };
