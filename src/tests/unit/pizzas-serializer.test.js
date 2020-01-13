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

const testSerializedPizza = (serializedPizza, ...includedArgs) => {
  const serializedPizzaData = 'data' in serializedPizza ? serializedPizza.data : serializedPizza;
  serializedPizzaData.attributes.should.deep.equal(goalSerializedPizza.data.attributes, 'it sets attributes correctly');

  serializedPizzaData.id.should.be.a('string', 'it sets type of id correctly');
  serializedPizzaData.id.should.equal('1', 'it sets value of id correctly');
  serializedPizzaData.type.should.equal('pizza', 'it sets value of type correctly');

  serializedPizza.links.self.should.equal('/v1/pizzas/1', 'it sets top level link correctly');

  if (includedArgs.includes('dough')) {
    if ('included' in serializedPizza) {
      serializedPizza.included
        .should.deep.include(goalSerializedPizza.included[0], 'it adds dough to included');
    }

    serializedPizzaData.relationships.dough
      .should.deep.equal(goalSerializedPizza.data.relationships.dough, 'it sets dough relationship values correctly');
  } else {
    should.equal(serializedPizzaData.relationships.dough.data, null, 'it puts null in serializedPizza.doughs');

    if ('included' in serializedPizza && includedArgs.includes('ingredients')) {
      serializedPizza.included.length.should.equal(1, 'it has only one element in `included`');

      serializedPizza.included[0]
        .should.deep.equal(goalSerializedPizza.included[1], 'it has an ingredient in `included`');
    }
  }

  if (includedArgs.includes('ingredients')) {
    if ('included' in serializedPizza) {
      serializedPizza.included
        .should.deep.include(goalSerializedPizza.included[1], 'it adds ingredients to included');
    }

    serializedPizzaData.relationships.ingredients
      .should.deep.equal(goalSerializedPizza.data.relationships.ingredients, 'it sets ingredients relationship values correctly');
  } else {
    serializedPizzaData.relationships.ingredients.data.length.should.equal(0, 'it puts an empty array in serializedPizza.ingredients');

    if ('included' in serializedPizza && includedArgs.includes('dough')) {
      serializedPizza.included.length.should.equal(1, 'it has only one element in `included`');

      serializedPizza.included[0]
        .should.deep.equal(goalSerializedPizza.included[0], 'it has a dough in `included`');
    }
  }
};

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

      it('serializes the pizza correctly', () => {
        testSerializedPizza(serializedPizza, 'ingredients', 'dough');
      });
    });
    context('when it gets a raw pizza with only ingredients', () => {
      before(() => {
        inputPizza = _.clone(baseInputPizza);
        inputPizza.dough = {};
      });

      it('serializes the pizza correctly', () => {
        testSerializedPizza(serializedPizza, 'ingredients');
      });
    });
    context('when it gets a raw pizza with only dough', () => {
      before(() => {
        inputPizza = _.clone(baseInputPizza);
        inputPizza.ingredients = [];
      });

      it('serializes the pizza correctly', () => {
        testSerializedPizza(serializedPizza, 'dough');
      });
    });
    context('when it gets a raw pizza with no dough or ingredients', () => {
      before(() => {
        inputPizza = _.clone(baseInputPizza);
        inputPizza.ingredients = [];
        inputPizza.dough = {};
      });

      it('serializes the pizza correctly', () => {
        testSerializedPizza(serializedPizza);
      });
    });
    context('when it gets a raw pizza with no ingredients member', () => {
      before(() => {
        inputPizza = _.omit(baseInputPizza, 'ingredients');
      });

      it('includes an ingredients relationship member with no data', () => {
        serializedPizza.data.relationships.ingredients.should.not.be.null;
        should.equal(serializedPizza.data.relationships.ingredients.data, undefined);
      });
    });
    context('when it gets a raw pizza with no dough member', () => {
      before(() => {
        inputPizza = _.omit(baseInputPizza, 'dough');
      });

      it('includes a dough relationship member with no data', () => {
        serializedPizza.data.relationships.dough.should.not.be.null;
        should.equal(serializedPizza.data.relationships.dough.data, undefined);
      });
    });
  });
  context('serializePizzas', () => {
    let serializedPizzas;
    let inputPizzas;
    let inputQuery = {};
    beforeEach(() => {
      serializedPizzas = pizzasSerializer.serializePizzas(inputPizzas, inputQuery);
    });
    context('when it gets an array of inputs', () => {
      before(() => {
        inputPizzas = [
          _.clone(baseInputPizza),
          _.clone(baseInputPizza),
        ];
      });
      it('returns a result with a `data` array', () => {
        serializedPizzas.data.should.be.an('array');
      });
      it('does not include duplicate members in `included`', () => {
        serializedPizzas.included.length.should.equal(2);
      });
      it('serializes the members of `data` correctly', () => {
        testSerializedPizza(serializedPizzas.data[0], 'ingredients', 'dough');
        testSerializedPizza(serializedPizzas.data[1], 'ingredients', 'dough');
      });
      it('generates the top level self link correctly', () => {
        serializedPizzas.links.self.should.equal('/v1/pizzas');
      });
      context('when it gets parameters', () => {
        before(() => {
          inputQuery = { 'filter[name]': 'abc' };
        });
        it('puts those queries in the top level self link', () => {
          serializedPizzas.links.self.should.equal('/v1/pizzas?filter[name]=abc');
        });
      });
    });
    context('when it gets an empty arrow of inputs', () => {
      before(() => {
        inputPizzas = [];
      });
      it('returns a result with an empty array `data` member', () => {
        serializedPizzas.data.length.should.equal(0);
      });
    });
  });
});
