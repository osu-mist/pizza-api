import _ from 'lodash';

class MalformedBodyError extends Error {
  constructor(params) {
    super(...params);
  }
}

class InvalidAttributeError extends Error {
  constructor(params) {
    super(...params);
  }
}

/**
 * Validate the body of a `POST` or `PATCH` request against an object
 * containing all valid attributes of the resource in question
 * @param {object} requestBody
 * @param {object} resourceAttributes
 */
const validateBody = (requestBody, resourceAttributes) => {
  if (!('data' in requestBody)) {
    throw new MalformedBodyError('Body does not include required "data" value');
  }
  if (!('attributes' in requestBody.data)) {
    throw new MalformedBodyError('Body does not include required "data.attributes" value');
  }
  const { attributes } = requestBody.data;
  _.keys(attributes).forEach((attribute) => {
    if (!(attribute in resourceAttributes)) {
      throw new InvalidAttributeError(`Attribute ${attribute} is invalid`);
    }
  });
};

export { validateBody, MalformedBodyError, InvalidAttributeError };
