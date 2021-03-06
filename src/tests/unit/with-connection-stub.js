/**
 * given a `sinon` stub, return a replacement for
 * `withConnection` that calls your stub instead of a database connection
 *
 * @param {object} connectionStub
 * @returns {function}
 */
const withConnectionStubGenerator = (connectionStub) => (closure, ...closureArgs) => closure(
  connectionStub, ...closureArgs,
);

export { withConnectionStubGenerator };
