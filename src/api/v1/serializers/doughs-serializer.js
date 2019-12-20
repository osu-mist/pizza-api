import { Serializer as JsonApiSerializer } from 'jsonapi-serializer';
import _ from 'lodash';

import { serializerOptions } from 'utils/jsonapi';
import { openapi } from 'utils/load-openapi';
import { apiBaseUrl, resourcePathLink, paramsLink } from 'utils/uri-builder';

const doughResourceProp = openapi.definitions.DoughRecipe.properties;
const doughResourceType = doughResourceProp.type.enum[0];
const doughResourceKeys = _.keys(doughResourceProp.attributes.properties);
const doughResourcePath = 'doughs';
const doughResourceUrl = resourcePathLink(apiBaseUrl, doughResourcePath);

/**
 * Replaces a null `specialInstructions` key with an empty string
 *
 * @param {object} dough
 * @returns {object} the dough with `specialInstructions` updated
 */
const transformDough = (dough) => {
  dough.specialInstructions = dough.specialInstructions || '';

  const intFields = [
    'gramsFlour',
    'gramsWater',
    'waterTemp',
    'gramsSalt',
    'gramsSugar',
    'gramsYeast',
    'gramsOliveOil',
    'bulkFermentTime',
    'proofTime',
  ];
  intFields.forEach((field) => {
    dough[field] = parseInt(dough[field], 10);
  });

  return dough;
};
/**
 * Serialize doughResources to JSON API
 *
 * @param {object[]} rawDoughs Raw data rows from data source
 * @param {object} query Query parameters
 * @returns {object} Serialized doughResource object
 */
const serializeDoughs = (rawDoughs, query) => {
  const topLevelSelfLink = paramsLink(doughResourceUrl, query);
  const serializerArgs = {
    identifierField: 'id',
    resourceKeys: doughResourceKeys,
    resourcePath: doughResourcePath,
    topLevelSelfLink,
    enableDataLinks: true,
    transformFunction: transformDough,
  };

  return new JsonApiSerializer(
    doughResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawDoughs);
};

/**
 * Serializes a single dough
 * @param {object} rawDough
 * @param {string} query
 * @returns {object} the serialized dough
 */
const serializeDough = (rawDough, query) => {
  const topLevelSelfLink = resourcePathLink(apiBaseUrl, query);
  const serializerArgs = {
    identifierField: 'id',
    resourceKeys: doughResourceKeys,
    resourcePath: doughResourcePath,
    topLevelSelfLink,
    enableDataLinks: true,
    transformFunction: transformDough,
  };

  return new JsonApiSerializer(
    doughResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawDough);
};

export { serializeDoughs, serializeDough, transformDough };
