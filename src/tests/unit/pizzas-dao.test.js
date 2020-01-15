import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import config from 'config';
import _ from 'lodash';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { getPizzasData, getPizzaByIdData, postPizzaData } from './test-data';

const should = chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

let connectionStub;
let getDoughByIdStub;
let pizzasDao;
let result;
let resultError;
let serializePizzaStub;
let serializePizzasStub;

const {
  fullRawPizzasReturn,
  getPizzasQuery,
  getPizzasQueryNameFilter,
  getPizzasWithDoughQuery,
  getPizzasWithIngredientsQuery,
  getPizzasWithIngredientsAndDoughsQuery,
  rawPizzaNoDoughOrIngredients,
  rawPizzaOnlyDoughReturn,
  rawPizzaOnlyIngredientsReturn,
  secondRawPizza,
} = getPizzasData;
const {
  baseSerializerReturn,
  emptyDbReturn,
  fullRawPizza,
  fullRawPizzaReturn,
  getPizzaDoughQuery,
  getPizzaIngredientsQuery,
  getPizzaQuery,
  rawPizzaReturnNullIngredients,
  rawPizzaReturnNullDough,
  rawPizzaReturnWithoutDough,
  rawPizzaReturnWithoutIngredients,
  rawPizzaReturnWithoutIngredientsOrDough,
  getPizzaIngredientsAndDoughQuery,
} = getPizzaByIdData;

const proxyquirePizzasDao = () => {
  const getConnectionStub = sinon.stub().resolves({
    execute: connectionStub,
    close: () => {},
  });

  return proxyquire('api/v1/db/oracledb/pizzas-dao', {
    './connection': {
      getConnection: getConnectionStub,
    },
    '../../serializers/pizzas-serializer': {
      serializePizza: serializePizzaStub,
      serializePizzas: serializePizzasStub,
    },
    './doughs-dao': {
      getDoughById: getDoughByIdStub,
    },
  });
};

describe('test pizzas DAO', () => {
  before(() => sinon.replace(config, 'get', () => ({ oracledb: {} })));
  after(() => sinon.restore());

  afterEach(() => {
    connectionStub.resetHistory();
    if (serializePizzaStub) serializePizzaStub.resetHistory();
    if (serializePizzasStub) serializePizzasStub.resetHistory();
  });

  context('getPizzaById', () => {
    let inputId;
    let inputQuery;
    before(() => {
      serializePizzaStub = sinon.stub().returns(baseSerializerReturn);
    });

    beforeEach(async () => {
      pizzasDao = proxyquirePizzasDao();
      result = await pizzasDao.getPizzaById(inputId, inputQuery);
    });

    afterEach(() => {
      serializePizzaStub.resetHistory();
      connectionStub.resetHistory();
    });

    context('when it is called with ingredients and doughs included', () => {
      before(() => {
        inputId = '1';
        inputQuery = { include: ['dough', 'ingredients'] };
      });
      context('when the database returns valid results for doughs, ingredients, and pizzas', () => {
        before(() => {
          connectionStub = sinon.stub().resolves(fullRawPizzaReturn);
        });

        it('calls the database once with the correct query to fetch a pizza', () => {
          connectionStub.should.have.been.calledWith(
            getPizzaIngredientsAndDoughQuery,
            { id: '1' },
          );
        });

        it('generates doughs, ingredients, and pizza values correctly from the database returns', () => {
          serializePizzaStub.should.have.been.calledWith(
            fullRawPizza,
            'pizzas/1',
          );
        });

        it('returns the result of the serializer', () => {
          result.should.deep.equal(baseSerializerReturn);
        });
      });
      context('when the database returns no pizza results', () => {
        before(() => {
          connectionStub = sinon.stub();
          connectionStub.onCall(0).returns(emptyDbReturn);
        });

        it('returns null', () => {
          should.equal(result, null);
        });
      });
      context('when the database returns no ingredient results', () => {
        before(() => {
          connectionStub = sinon.stub().resolves(rawPizzaReturnNullIngredients);
        });

        it('generates a raw pizza with ingredients as an empty array', () => {
          serializePizzaStub.getCall(0).args[0].ingredients.should.deep.equal([]);
        });
      });
      context('when the database returns no dough results', () => {
        before(() => {
          connectionStub = sinon.stub().resolves(rawPizzaReturnNullDough);
        });

        it('generates a raw pizza with dough as an empty object', () => {
          serializePizzaStub.getCall(0).args[0].dough.should.deep.equal({});
        });
      });
    });
    context('when it is called with only ingredients included', () => {
      before(() => {
        inputQuery = { include: ['ingredients'] };
        connectionStub = sinon.stub().resolves(rawPizzaReturnWithoutDough);
      });

      it('does not query the database for doughs', () => {
        connectionStub.should.have.been.calledWith(
          getPizzaIngredientsQuery,
          { id: '1' },
        );
      });
      it('does not generate a doughs member of pizzas', () => {
        serializePizzaStub.getCall(0).args[0].should.not.have.property('dough');
      });

      it('does include ingredients in pizzas', () => {
        serializePizzaStub.getCall(0).args[0].should.have.property('ingredients');
      });
    });
    context('when it is called with only dough included', () => {
      before(() => {
        inputQuery = { include: ['dough'] };
        connectionStub = sinon.stub().resolves(rawPizzaReturnWithoutIngredients);
      });

      it('does not query the database for ingredients', () => {
        connectionStub.should.have.been.calledWith(
          getPizzaDoughQuery,
          { id: '1' },
        );
      });

      it('does not generate an ingredients member of pizzas', () => {
        serializePizzaStub.getCall(0).args[0].should.not.have.property('ingredients');
      });
      it('does include dough in pizza', () => {
        serializePizzaStub.getCall(0).args[0].should.have.property('dough');
      });
    });
    context('when it is called with neither ingredients nor doughs included', () => {
      before(() => {
        inputQuery = {};
        connectionStub = sinon.stub()
          .resolves(rawPizzaReturnWithoutIngredientsOrDough);
      });

      it('does not query the database for ingredients or doughs', () => {
        connectionStub.should.have.been.calledWith(
          getPizzaQuery,
          { id: '1' },
        );
      });

      it('does not generate dough or ingredients members', () => {
        serializePizzaStub.getCall(0).args[0].should.not.have.property('ingredients');
        serializePizzaStub.getCall(0).args[0].should.not.have.property('dough');
      });
    });
  });
  context('getPizzas', () => {
    let inputQuery;

    before(() => {
      connectionStub = sinon.stub().resolves(rawPizzaReturnWithoutIngredientsOrDough);
      serializePizzasStub = sinon.stub().returns(baseSerializerReturn);
    });

    beforeEach(async () => {
      pizzasDao = proxyquirePizzasDao();
      result = await pizzasDao.getPizzas(inputQuery);
    });

    context('when it gets valid filters', () => {
      before(() => {
        inputQuery = { 'filter[name]': 'test pizza' };
      });

      it('generates query and bind params using that filter', () => {
        connectionStub.should.have.been.calledWith(
          getPizzasQueryNameFilter,
          { name: 'test pizza' },
        );
      });
    });
    context('when it gets invalid filters', () => {
      before(() => {
        inputQuery = { foo: 'bar' };
      });

      it('generates query and bind params without using that filter', () => {
        connectionStub.should.have.been.calledWith(
          getPizzasQuery,
          {},
        );
      });
    });
    context('when dough and ingredients are included', () => {
      before(() => {
        inputQuery = { include: ['dough', 'ingredients'] };
      });

      it('queries the database for doughs, ingredients', () => {
        connectionStub.should.have.been.calledWith(
          getPizzasWithIngredientsAndDoughsQuery,
          {},
        );
      });

      context('when the database returns multiple results', () => {
        before(() => {
          connectionStub.returns(fullRawPizzasReturn);
        });

        it('sends two pizza records to the serializer', () => {
          serializePizzasStub.should.have.been.calledWith(
            [fullRawPizza, secondRawPizza],
          );
        });
      });

      context('when the database returns no results', () => {
        before(() => {
          connectionStub.returns(emptyDbReturn);
        });

        it('sends an empty array to the serializer', () => {
          serializePizzasStub.should.have.been.calledWith([]);
        });
      });
    });

    context('when only dough is included', () => {
      before(() => {
        inputQuery = { include: ['dough'] };
        connectionStub.returns(rawPizzaOnlyDoughReturn);
      });

      it('queries the database for doughs only', () => {
        connectionStub.should.have.been.calledWith(
          getPizzasWithDoughQuery,
          {},
        );
      });

      it('sends records to the serializer with only dough attributes', () => {
        serializePizzasStub.should.have.been.calledWith([
          _.omit(fullRawPizza, 'ingredients'),
          _.omit(secondRawPizza, 'ingredients'),
        ]);
      });
    });

    context('when only ingredients is included', () => {
      before(() => {
        inputQuery = { include: ['ingredients'] };
        connectionStub.returns(rawPizzaOnlyIngredientsReturn);
      });

      it('queries the database for ingredients only', () => {
        connectionStub.should.have.been.calledWith(
          getPizzasWithIngredientsQuery,
          {},
        );
      });

      it('sends records to the serializer with only ingredients attributes', () => {
        serializePizzasStub.should.have.been.calledWith([
          _.omit(fullRawPizza, 'dough'),
          _.omit(secondRawPizza, 'dough'),
        ]);
      });
    });

    context('when nothing is included', () => {
      before(() => {
        inputQuery = {};
        connectionStub.returns(rawPizzaNoDoughOrIngredients);
      });

      it('sends records to the serializer with no dough or ingredients attributes', () => {
        serializePizzasStub.should.have.been.calledWith([
          _.omit(fullRawPizza, 'dough', 'ingredients'),
          _.omit(secondRawPizza, 'dough', 'ingredients'),
        ]);
      });
    });
  });

  context('postPizza', () => {
    let inputBody;

    before(() => {
      connectionStub.returns(postPizzaData.validQueryReturn);
    });

    beforeEach(async () => {
      pizzasDao = proxyquirePizzasDao();
      try {
        result = await pizzasDao.postPizza(inputBody);
      } catch (e) {
        resultError = e;
      }
    });

    context('when it gets a body with valid attributes', () => {
      before(() => {
        inputBody = postPizzaData.validBody;
      });

      it('calls the database with the right query and bind params', () => {
        connectionStub.should.have.been.calledWith(
          postPizzaData.postPizzaQuery,
          postPizzaData.postPizzaBindParams,
          { autoCommit: true },
        );
      });

      it('correctly normalizes the result and passes it to the database', () => {
        serializePizzaStub.should.have.been.calledWith(postPizzaData.normalizedDbReturn, 'pizzas');
      });

      it('returns the result from the serializer', () => {
        result.should.deep.equal(baseSerializerReturn);
      });
    });

    context('when it gets a body with invalid attributes', () => {
      before(() => {
        inputBody = postPizzaData.invalidBody;
      });

      it('throws an error', () => {
        resultError.message.should.equal('Invalid attribute foo found');
      });

      it('does not call the database', () => {
        connectionStub.should.not.have.been.called;
      });
    });
  });
});
