import OracleDB from 'oracledb';

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
 * @param {OracleDB.connection} connection
 * @returns {Promise<object>}
 */

/**
 * given a `sinon` stub, return a replacement for
 * `withConnection` that calls your stub instead of a database connection
 *
 * @param {object} connectionStub
 * @returns {function}
 */
const withConnectionStubGenerator = (connectionStub) => (closure) => {
  closure(connectionStub);
};

export { withConnection, withConnectionStubGenerator };
