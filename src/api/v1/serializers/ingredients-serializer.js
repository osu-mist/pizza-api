import { Serializer as JsonApiSerializer } from 'jsonapi-serializer';
import _ from 'lodash';

import { serializerOptions } from 'utils/jsonapi';
import { openapi } from 'utils/load-openapi';
import { apiBaseUrl, resourcePathLink, paramsLink } from 'utils/uri-builder';

const ingredientResourceProp = openapi.definitions.IngredientResource.properties;
const ingredientResourceType = ingredientResourceProp.type.enum[0];
const ingredientResourceKeys = _.keys(ingredientResourceProp.attributes.properties);
const ingredientResourcePath = 'ingredients';
const ingredientResourceUrl = resourcePathLink(apiBaseUrl, ingredientResourcePath);

/**
 * Serialize doughResources to JSON API
 *
 * @param {object[]} rawIngredients Raw data rows from data source
 * @param {object} query Query parameters
 * @returns {object} Serialized doughResource object
 */
const serializeIngredients = (rawIngredients, query) => {
  const topLevelSelfLink = paramsLink(ingredientResourceUrl, query);
  const serializerArgs = {
    identifierField: 'id',
    resourceKeys: ingredientResourceKeys,
    resourcePath: ingredientResourcePath,
    topLevelSelfLink,
    enableDataLinks: true,
  };

  return new JsonApiSerializer(
    ingredientResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawIngredients);
};

export { serializeIngredients };
