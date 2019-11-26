import _ from 'lodash';
import { Serializer as JsonApiSerializer } from 'jsonapi-serializer';

import { serializerOptions } from 'utils/jsonapi';
import { openapi } from 'utils/load-openapi';
import { apiBaseUrl, paramsLink, resourcePathLink } from 'utils/uri-builder';

const ingredientResourceProp = openapi.definitions.IngredientResource.properties;
const ingredientResourceType = ingredientResourceProp.type.enum[0];
const ingredientResourceKeys = _.keys(ingredientResourceProp.attributes.properties);
const ingredientResourcePath = 'ingredients';
const ingredientResourceUrl = resourcePathLink(apiBaseUrl, ingredientResourcePath);

/**
 * Replaces a null `notes` key with an empty string
 *
 * @param {object} ingredient
 * @returns {object} the ingredient with `notes` updated
 */
const transformNotes = (ingredient) => {
  ingredient.notes = ingredient.notes || '';
  return ingredient;
};
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
    transformFunction: transformNotes,
  };

  return new JsonApiSerializer(
    ingredientResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawIngredients);
};

/**
 * Serializes a single ingredient
 *
 * @param {object} rawIngredient
 * @param {string} query
 * @returns {object} the serialized ingredient
 */
const serializeIngredient = (rawIngredient, query) => {
  const topLevelSelfLink = paramsLink(ingredientResourceUrl, query);
  const serializerArgs = {
    identifierField: 'id',
    resourceKeys: ingredientResourceKeys,
    resourcePath: ingredientResourcePath,
    topLevelSelfLink,
    enableDataLinks: true,
    transformFunction: transformNotes,
  };

  return new JsonApiSerializer(
    ingredientResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawIngredient);
};

export { serializeIngredients, serializeIngredient };
