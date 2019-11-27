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

const {
  nullNotesIngredient,
  emptyStringNotesIngredient,
} = ingredientSerializerData;

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
      beforeEach(() => {
        rawIngredient = nullNotesIngredient;
      });

      it('changes null to empty string', () => {
        const serializedIngredient = ingredientSerializer
          .serializeIngredient(rawIngredient, '/ingredient');
        serializedIngredient.data.attributes.notes.should.equal('');
      });
    });

    describe('when it gets an ingredient with `notes` = \'\'', () => {
      beforeEach(() => {
        rawIngredient = emptyStringNotesIngredient;
      });

      it('leaves `notes` unchanged', () => {
        const serializedIngredient = ingredientSerializer
          .serializeIngredient(rawIngredient, '/ingredient');
        serializedIngredient.data.attributes.notes.should.equal('');
      });
    });

    describe('when it gets a raw ingredient with a valid format', () => {
      beforeEach(() => {
        rawIngredient = emptyStringNotesIngredient;
      });

      it('adds a top level self link', () => {
        const serializedIngredient = ingredientSerializer
          .serializeIngredient(rawIngredient, 'ingredients');
        serializedIngredient.links.self.should.equal('/v1/ingredients');
      });

      it('adds type and id at the top level of data', () => {
        const serializedIngredient = ingredientSerializer
          .serializeIngredient(rawIngredient, 'ingredients');
        serializedIngredient.data.type.should.equal('ingredient');
        serializedIngredient.data.id.should.equal('201');
      });

      it('adds all of the right attributes to `attributes`', () => {
        const serializedIngredient = ingredientSerializer
          .serializeIngredient(rawIngredient, 'ingredients');
        _.forIn(ingredientAttributes, (value, attribute) => {
          serializedIngredient.data.attributes.should.have.property(attribute);
        });
        serializedIngredient.data.attributes.should.not.have.property('id');
      });
    });
  });
  describe('serializeIngredients', () => {
    describe('when it gets a dough object with valid formatting', () => {
      beforeEach(() => {
        rawIngredients = [
          emptyStringNotesIngredient,
        ];
      });

      it('returns an object with a data member that is an array', () => {
        const serializedIngredients = ingredientSerializer
          .serializeIngredients(rawIngredients);
        serializedIngredients.data.should.be.a('array');
      });

      it('populates the right attributes for each member of the data list', () => {
        const serializedIngredients = ingredientSerializer
          .serializeIngredients(rawIngredients);
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

      it('creates a top level link when no parameters are passed', () => {
        const serializedIngredients = ingredientSerializer
          .serializeIngredients(rawIngredients);
        serializedIngredients.links.self.should.equal('/v1/ingredients');
      });

      it('creates a top level link when parameters are passed', () => {
        const serializedIngredients = ingredientSerializer
          .serializeIngredients(rawIngredients, { id: 1 });
        serializedIngredients.links.self.should.equal('/v1/ingredients?id=1');
      });
    });

    describe('when it gets a rawIngredient with `notes` = null', () => {
      beforeEach(() => {
        rawIngredients = [
          nullNotesIngredient,
        ];
      });

      it('converts that null to an empty string', () => {
        const serializedIngredients = ingredientSerializer
          .serializeIngredients(rawIngredients);
        serializedIngredients.data[0].attributes.notes.should.equal('');
      });
    });
  });
});
