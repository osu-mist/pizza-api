import chai from 'chai';
import config from 'config';
import _ from 'lodash';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { serializePizzaData } from './test-data';

const should = chai.should();

let pizzasSerializer;

const {
  baseInputPizza,
  goalSerializedPizza,
} = serializePizzaData;

describe('test pizzas serializer', () => {
  before(() => {
    sinon.replace(config, 'get', () => ({ oracledb: {} }));
    pizzasSerializer = proxyquire('../../api/v1/serializers/pizzas-serializer', {});
  });
  after(() => sinon.restore());
  context('serializePizza', () => {
    let inputPizza;
    let serializedPizza;
    beforeEach(() => {
      serializedPizza = pizzasSerializer.serializePizza(inputPizza, 'pizzas/1');
    });
    context('when it gets a raw pizza with doughs and ingredients', () => {
      before(() => {
        inputPizza = _.clone(baseInputPizza);
      });
      it('serializes the pizza attributes correctly', () => {
        serializedPizza.data.attributes.should.deep.equal(goalSerializedPizza.data.attributes);
      });
      it('sets id and type correctly', () => {
        serializedPizza.data.id.should.be.a('string');
        serializedPizza.data.id.should.equal('1');
        serializedPizza.data.type.should.equal('pizza');
      });
      it('sets the correct top level link', () => {
        serializedPizza.links.self.should.equal('/v1/pizzas/1');
      });
      it('serializes dough relationships correctly', () => {
        serializedPizza.data.relationships.dough
          .should.deep.equal(goalSerializedPizza.data.relationships.dough);
      });
      it('serializes ingredient relationships correctly', () => {
        serializedPizza.data.relationships.ingredients
          .should.deep.equal(goalSerializedPizza.data.relationships.ingredients);
      });
      it('adds the dough to included', () => {
        // would prefer to use `serializedPizza.included.should.include` here,
        // but this gives a *much* more useful diff when the test fails
        serializedPizza.included[0]
          .should.deep.equal(goalSerializedPizza.included[0]);
      });
      it('adds the ingredients to included', () => {
        serializedPizza.included[1]
          .should.deep.equal(goalSerializedPizza.included[1]);
      });
    });
    context('when it gets a raw pizza with only ingredients', () => {
      before(() => {
        inputPizza = _.clone(baseInputPizza);
        inputPizza.dough = {};
      });
      it('puts an null for the dough relationship data', () => {
        should.equal(serializedPizza.data.relationships.dough.data, null);
      });
      it('has only one element in `included`', () => {
        serializedPizza.included.length.should.equal(1);
        serializedPizza.included[0]
          .should.deep.equal(goalSerializedPizza.included[1]);
      });
    });
    context('when it gets a raw pizza with only dough', () => {
      before(() => {
        inputPizza = _.clone(baseInputPizza);
        inputPizza.ingredients = [];
      });
      it('puts an empty array for the ingredient relationship data', () => {
        serializedPizza.data.relationships.ingredients.data.should.deep.equal([]);
      });
      it('has only one element in `included`', () => {
        serializedPizza.included.length.should.equal(1);
        serializedPizza.included[0]
          .should.deep.equal(goalSerializedPizza.included[0]);
      });
    });
    context('when it gets a raw pizza with no dough or ingredients', () => {
      before(() => {
        inputPizza = _.clone(baseInputPizza);
        inputPizza.ingredients = [];
        inputPizza.dough = {};
      });
      it('puts an empty array for the ingredient relationship data', () => {
        serializedPizza.data.relationships.ingredients.data.should.deep.equal([]);
      });
      it('puts an null for the dough relationship data', () => {
        should.equal(serializedPizza.data.relationships.dough.data, null);
      });
      it('has nothing in `included`', () => {
        // possibly a more desirable behavior would be to return an empty
        // array, but I don't see a good way to do that with the serializer
        should.equal(serializedPizza.included, undefined);
      });
    });
  });
});
