import _ from 'lodash';

/**
 * compare two relationship objects to see if
 * they share the same type and id
 *
 * @param {object} baseRelation
 * @param {object} compareRelation
 * @returns {boolean}
 */
const compareRelationships = (baseRelation, compareRelation) => (
  baseRelation.id === compareRelation.id
    && baseRelation.type === compareRelation.type
);
/**
 * check if all array relationships contain only
 * unique id/type combinations
 *
 * @type {RequestHandler}
 */
const checkRelationshipArrayUniqueness = (req, res, next) => {
  const { relationships } = req.body.data;
  if (relationships) {
    _.forEach(relationships, (relationship, relationName) => {
      if (_.isArray(relationship.data)) {
        const uniqueData = _.uniqWith(relationship.data, compareRelationships);
        if (uniqueData.length !== relationship.data.length) {
          const err = new Error();
          err.customStatus = 400;
          err.customMessage = `Relationship ${relationName} contains non-unique elements`;
          next(err);
        } else {
          next();
        }
      }
    });
  }
};

export { checkRelationshipArrayUniqueness };
