import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import config from 'config';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { getPizzaByIdData } from './test-data';

const should = chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

let connectionStub;
let getDoughByIdStub;
let pizzasDao;
let result;
let resultError;
let serializePizzaStub;

const {
  baseSerializerReturn,
  emptyDbReturn,
  fullRawPizza,
  getPizzaByIdQuery,
  getPizzaIngredientsQuery,
  multipleRowsReturn,
  pizzaDbReturn,
  pizzaIngredientsDbReturn,
  serializedDoughReturn,
} = getPizzaByIdData;

const setUpDatabaseStubs = (firstCall, secondCall, serializerReturn) => {
  connectionStub = sinon.stub();
  connectionStub.onCall(0).resolves(firstCall);
  connectionStub.onCall(1).resolves(secondCall);
  getDoughByIdStub = sinon.stub().returns(serializerReturn);
};

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
    },
    './doughs-dao': {
      getDoughById: getDoughByIdStub,
    },
  });
};


describe('test pizzas DAO', () => {
  before(() => sinon.replace(config, 'get', () => ({ oracledb: {} })));
  after(() => sinon.restore());
  context('getPizzaById', () => {
    let inputId;
    before(() => {
      serializePizzaStub = sinon.stub().returns(baseSerializerReturn);
    });
    beforeEach(async () => {
      pizzasDao = proxyquirePizzasDao();
      try {
        result = await pizzasDao.getPizzaById(inputId);
      } catch (err) {
        resultError = err;
      }
    });
    afterEach(() => {
      serializePizzaStub.resetHistory();
      connectionStub.resetHistory();
    });
    context('when it is called with a valid id', () => {
      before(() => {
        inputId = '1';
      });
      context('when the database returns valid results for doughs, ingredients, and pizzas', () => {
        before(() => {
          setUpDatabaseStubs(pizzaDbReturn, pizzaIngredientsDbReturn, serializedDoughReturn);
        });
        it('calls the database once with the correct query to fetch a pizza', () => {
          connectionStub.getCall(0).should.have.been.calledWith(
            getPizzaByIdQuery,
            { id: '1' },
          );
        });
        it('calls the database a second time with the correct query to fetch ingredients for a pizza', () => {
          connectionStub.getCall(1).should.have.been.calledWith(
            getPizzaIngredientsQuery,
            { id: '1' },
          );
        });
        it('generates doughs, ingredients, and pizza values correctly from the database returns', () => {
          serializePizzaStub.should.have.been.calledWith(
            fullRawPizza,
            'pizzas/1',
          );
        });
        it('returns the result of the serialize', () => {
          result.should.deep.equal(baseSerializerReturn);
        });
      });
      context('when the database returns no pizza results', () => {
        before(() => {
          connectionStub = sinon.stub();
          connectionStub.onCall(0).returns(emptyDbReturn);
        });
        it('only calls the database once', () => {
          connectionStub.should.have.been.calledOnce;
        });
        it('returns null', () => {
          should.equal(result, null);
        });
      });
      context('when the database returns no ingredient results', () => {
        before(() => {
          connectionStub = sinon.stub();
          setUpDatabaseStubs(pizzaDbReturn, emptyDbReturn, serializedDoughReturn);
        });
        it('generates a raw pizza with an empty array for the ingredients member', () => {
          serializePizzaStub.getCall(0).args[0].ingredients.should.deep.equal([]);
        });
      });
      context('when the database returns no dough results', () => {
        before(() => {
          setUpDatabaseStubs(pizzaDbReturn, emptyDbReturn, null);
        });
        it('generates a raw pizza with dough equal to empty object', () => {
          serializePizzaStub.getCall(0).args[0].dough.should.deep.equal({});
        });
      });
      context('when the database returns multiple pizza results', () => {
        before(() => {
          setUpDatabaseStubs(multipleRowsReturn, pizzaIngredientsDbReturn, serializedDoughReturn);
        });
        it('throws an error', () => {
          resultError.message.should.equal('Returned multiple outputs for the same ID');
        });
        it('only calls the database once', () => {
          connectionStub.should.have.been.calledOnce;
        });
      });
    });
  });
});
