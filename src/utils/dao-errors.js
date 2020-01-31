/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */

class ResourceNotFoundError {
  /**
   * @param {string} resource the type of the resource
   * @param {string} id the id request
   */
  constructor(resource, id) {
    this.id = id;
    this.resource = resource;
  }

  get [Symbol.toStringTag]() {
    return 'ResourceNotFoundError';
  }
}

/**
 * A requested relation(s) is missing from the database
 * @class
 */
class ResourceRelationNotFoundError {
  /**
   * @param {string} relation the name of the relationship
   * @param {...string} ids 0 or more of the invalid IDs requested
   */
  constructor(relation, ...ids) {
    this.ids = ids;
    this.relation = relation;
  }

  get [Symbol.toStringTag]() {
    return 'ResourceRelationNotFoundError';
  }
}

export { ResourceNotFoundError, ResourceRelationNotFoundError };
