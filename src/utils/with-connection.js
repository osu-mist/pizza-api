import { getConnection } from 'api/v1/db/oracledb/connection';

/**
 *
 * @param {withConnectionClosure} closure must be an async function
 * @param {object[]} closureArgs arguments to pass to `closure`
 * @returns {*} the result of calling `closure` with a new `connection` object
 */
const withConnection = async (closure, ...closureArgs) => {
  const connection = await getConnection();
  return closure(connection, ...closureArgs).finally(() => connection.close());
};

/**
 *
 * @callback withConnectionClosure
 * @param {object} connection an oracleDB connection
 * @returns {Promise<object>}
 */


export { withConnection };
