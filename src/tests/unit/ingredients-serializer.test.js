import chai from 'chai';
import config from 'config';
import _ from 'lodash';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { openapi } from 'utils/load-openapi';
import { ingredientSerializerData } from './test-data';

const ingredientAttributes = openapi.definitions.IngredientAttributes.properties;

chai.should();

let rawIngredient;
let rawIngredients;
let ingredientSerializer;
let serializerResult;
let serializedIngredient;
let serializedIngredients;

const {
  nullNotesIngredient,
  emptyStringNotesIngredient,
} = ingredientSerializerData;

const initializeSerializeIngredientTest = (ingredientValue, ...serializerArgs) => {
  beforeEach(() => {
    rawIngredient = ingredientValue;
    serializedIngredient = ingredientSerializer
      .serializeIngredient(rawIngredient, ...serializerArgs);
    serializerResult = serializedIngredient;
  });
};

const initializeSerializeIngredientsTest = (ingredientsValue, ...serializerArgs) => {
  beforeEach(() => {
    rawIngredients = ingredientsValue;
    serializedIngredients = ingredientSerializer
      .serializeIngredients(rawIngredients, ...serializerArgs);
    serializerResult = serializedIngredients;
  });
};

const itMakesNotesAnEmptyString = () => {
  it('makes special instructions an empty string', () => {
    serializedIngredient
      .data.attributes.notes.should.equal('');
  });
};

const itCreatesTheCorrectTopLevelLink = (desiredLink) => {
  it('create a correct top level link', () => {
    serializerResult.links.self.should.equal(desiredLink);
  });
};

describe('test ingredients serializer', () => {
  before(() => {
    sinon.replace(config, 'get', () => ({ oracledb: {} }));
    // see comment in doughs-serializer.test.js
    ingredientSerializer = proxyquire('../../api/v1/serializers/ingredients-serializer', {});
  });

  after(() => {
    sinon.restore();
  });

  describe('serializeIngredient', () => {
    describe('when it gets an ingredient object with `notes` = null', () => {
      initializeSerializeIngredientTest(nullNotesIngredient);

      itMakesNotesAnEmptyString();
    });

    describe('when it gets an ingredient with `notes` = \'\'', () => {
      initializeSerializeIngredientTest(emptyStringNotesIngredient);

      itMakesNotesAnEmptyString();
    });

    describe('when it gets a raw ingredient with a valid format', () => {
      initializeSerializeIngredientTest(emptyStringNotesIngredient, 'ingredients');

      itCreatesTheCorrectTopLevelLink('/v1/ingredients');

      it('adds type and id at the top level of data', () => {
        serializedIngredient.data.type.should.equal('ingredient');
        serializedIngredient.data.id.should.equal('201');
      });

      it('adds all of the right attributes to `attributes`', () => {
        _.forIn(ingredientAttributes, (value, attribute) => {
          serializedIngredient.data.attributes.should.have.property(attribute);
        });
        serializedIngredient.data.attributes.should.not.have.property('id');
      });
    });
  });
  describe('serializeIngredients', () => {
    describe('when it gets a dough object with valid formatting', () => {
      initializeSerializeIngredientsTest([emptyStringNotesIngredient]);

      it('returns an object with a data member that is an array', () => {
        serializedIngredients.data.should.be.a('array');
      });

      it('populates the right attributes for each member of the data list', () => {
        serializedIngredients.data.forEach((ingredient, index) => {
          _.forIn(ingredientAttributes, (value, attribute) => {
            ingredient.attributes.should.have.property(attribute);
            ingredient.attributes[attribute].should.equal(rawIngredients[index][attribute]);
          });
          ingredient.attributes.should.not.have.property('id');
          ingredient.type.should.equal('ingredient');
          ingredient.id.should.equal(String(rawIngredients[index].id));
          ingredient.links.self.should.equal(`/v1/ingredients/${rawIngredients[index].id}`);
        });
      });

      itCreatesTheCorrectTopLevelLink('/v1/ingredients');

      context('when parameters are passed', () => {
        initializeSerializeIngredientsTest(
          emptyStringNotesIngredient,
          { id: 1 },
        );

        itCreatesTheCorrectTopLevelLink('/v1/ingredients?id=1');
      });
    });

    describe('when it gets a rawIngredient with `notes` = null', () => {
      initializeSerializeIngredientsTest([nullNotesIngredient]);

      it('converts that null to an empty string', () => {
        serializedIngredients.data[0].attributes.notes.should.equal('');
      });
    });
  });
});
