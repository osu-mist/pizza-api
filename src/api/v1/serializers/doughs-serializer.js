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
  };

  return new JsonApiSerializer(
    doughResourceType,
    serializerOptions(serializerArgs),
  ).serialize(rawDoughs);
};

export { serializeDoughs };
