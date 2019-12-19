import { Serializer as JsonApiSerializer } from 'jsonapi-serializer';
import _ from 'lodash';

import { transformDough } from 'api/v1/serializers/doughs-serializer';
import { transformIngredient } from 'api/v1/serializers/ingredients-serializer';
import { serializerOptions } from 'utils/jsonapi';
import { openapi } from 'utils/load-openapi';
import { apiBaseUrl, resourcePathLink } from 'utils/uri-builder';


const pizzaResourceProp = openapi.definitions.PizzaResource.properties;
const pizzaResourceType = pizzaResourceProp.type.enum[0];
const pizzaResourceKeys = _.keys(pizzaResourceProp.attributes.properties);
const pizzaResourcePath = 'pizzas';

const doughResourceProp = openapi.definitions.DoughRecipe.properties;
const doughResourceKeys = _.keys(doughResourceProp.attributes.properties);

const ingredientResourceProp = openapi.definitions.IngredientResource.properties;
const ingredientResourceKeys = _.keys(ingredientResourceProp.attributes.properties);

/**
 * Replace `null` with empty string and conver to int as appropriate
 *
 * @param {object} rawPizza a pizza object from the database
 * @returns {object} the transformed pizza
 */
const transformRawPizza = (rawPizza) => {
  if ('ingredients' in rawPizza) {
    rawPizza.ingredients.map((rawIngredient) => transformIngredient(rawIngredient));
  }
  if ('dough' in rawPizza) {
    rawPizza.dough = transformDough(rawPizza.dough);
  }

  rawPizza.specialInstructions = rawPizza.specialInstructions || '';

  [
    'ovenTemp',
    'bakeTime',
  ].forEach((integerField) => {
    rawPizza[integerField] = parseInt(rawPizza[integerField], 10);
  });

  return rawPizza;
};

/**
 * Add a compound relationship named `relationName` to `options`
 * with keys `relationKeys` and primary key field `idField`
 *
 * @param {object} options
 * @param {string} relationName
 * @param {object} relationKeys
 * @param {string} idField
 * @param {boolean} [ignoreRelationshipData=false] used when the `data` member of
 * the relationship should be omitted
 * @returns {object} `options` with `relationName` added
 */
const addCompoundRelationship = (
  options,
  relationName,
  relationKeys,
  ignoreRelationshipData = false,
) => {
  const idField = 'id';
  const resourceUrl = resourcePathLink(apiBaseUrl, relationName);
  options.attributes = _.concat(options.attributes, relationName);
  options[relationName] = {
    ref: (collection, field) => (field && idField in field ? field[idField] : undefined),
    included: true,
    attributes: relationKeys,
    ignoreRelationshipData,
    nullIfMissing: true,
    relationshipLinks: {
      related: `${options.topLevelLinks.self}/${relationName}`,
      self: `${options.topLevelLinks.self}/relationships/${relationName}`,
    },
    includedLinks: {
      self: (collection,
        field) => (field ? resourcePathLink(resourceUrl, field[idField]) : undefined),
    },
  };
  return options;
};

/**
 * Serializes a pizza resource
 *
 * @param {object} rawPizza
 * @param {string} query
 * @returns {object} the serialized pizza
 */
const serializePizza = (rawPizza, query) => {
  const topLevelSelfLink = resourcePathLink(apiBaseUrl, query);
  const serializerArgs = {
    identifierField: 'id',
    resourceKeys: pizzaResourceKeys,
    resourcePath: pizzaResourcePath,
    topLevelSelfLink,
    enableDataLinks: true,
    transformFunction: transformRawPizza,
  };

  let options = serializerOptions(serializerArgs);
  if ('dough' in rawPizza) {
    options = addCompoundRelationship(options, 'dough', doughResourceKeys);
  } else {
    options = addCompoundRelationship(options, 'dough', doughResourceKeys, true);
  }
  if ('ingredients' in rawPizza) {
    options = addCompoundRelationship(options, 'ingredients', ingredientResourceKeys);
  } else {
    options = addCompoundRelationship(options, 'ingredients', ingredientResourceKeys, true);
  }

  // need to depluralize type of `ingredients` compound resources . . . somehow
  // returning `undefined` means it uses the default value
  options.typeForAttribute = (attribute, data) => ('ingredientType' in data ? 'ingredient' : undefined);

  return new JsonApiSerializer(
    pizzaResourceType,
    options,
  ).serialize(rawPizza);
};

export { serializePizza };
