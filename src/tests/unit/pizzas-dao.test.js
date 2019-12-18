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
let serializePizzaStub;

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
        inputQuery = { includes: ['dough', 'ingredients'] };
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
        inputQuery = { includes: ['ingredients'] };
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
        inputQuery = { includes: ['dough'] };
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
});
