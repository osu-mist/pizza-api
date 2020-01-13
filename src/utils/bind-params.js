import _ from 'lodash';

/**
 * Generate bind params from a POST or PATCH body, assuming invalid attributes
 * have been removed and non-included values have been substituted for their
 * defaults. If included, the return will include the values in `baseValue`.
 *
 * @param {object} body
 * @param {object} allowedProperties an object whose keys are the only keys
 * allowed from `body.data` in `bindParams`
 * @param {object} baseValue use to include other out bind variables that are not in body
 * @returns {object} bindparams
 * @throws {Error} when an attribute not in doughsProperties is found in body.
 * It's assumed that body has already been checked for invalid properties meaning that when
 * one is found here it's a server error rather than a user error.
 */
const getBindParams = (body, allowedProperties, baseValue = {}) => {
  const { attributes } = body.data;
  const bindParams = _.cloneDeep(baseValue);
  _.forEach(attributes, (attributeValue, attributeName) => {
    if (!(attributeName in allowedProperties)) {
      throw new Error(`Invalid attribute ${attributeName} found`);
    }
    bindParams[attributeName] = attributeValue;
  });
  return bindParams;
};

/**
 * convert an output bind param name like `nameOut` to a
 * property name like `name` by removing 'Out' at the end of the string
 *
 * @param {string} outBindParamName
 * @returns {string} the property name
 */
const outBindParamToPropertyName = (outBindParamName) => {
  const outBindEndRegex = /(.*)Out$/;
  const regexResults = outBindEndRegex.exec(outBindParamName);
  return regexResults ? regexResults[1] : outBindParamName;
};

/**
 * Converts the return value of a SQL query that uses
 * `RETURNS ... INTO ...` into the format of the return
 * from a `SELECT` query to it can be passed directly to
 * `serializeIngredient`.
 *
 * @param {object} outBinds
 * @returns {object}
 */
const convertOutBindsToRawResource = (outBinds) => _.reduce(outBinds,
  (rawResource, bindValueArray, bindName) => {
    [rawResource[outBindParamToPropertyName(bindName)]] = bindValueArray;
    return rawResource;
  }, {});

export { convertOutBindsToRawResource, getBindParams, outBindParamToPropertyName };
