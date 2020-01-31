import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import config from 'config';
import _ from 'lodash';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { withConnectionStubGenerator } from './with-connection-stub';
import {
  getPizzasData, getPizzaByIdData, postPizzaData, updatePizzaByIdData,
} from './test-data';

const should = chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

let checkIngredientsExistsStub;
let executeStub;
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
  const connectionStub = {
    execute: executeStub,
    close: () => {},
  };
  const getConnectionStub = sinon.stub().resolves(connectionStub);
  const withConnectionStub = withConnectionStubGenerator(connectionStub);

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
    './ingredients-dao': {
      checkIngredientsExist: checkIngredientsExistsStub,
    },
    '../../../../utils/with-connection': {
      withConnection: withConnectionStub,
    },
  });
};

describe('test pizzas DAO', () => {
  before(() => sinon.replace(config, 'get', () => ({ oracledb: {} })));
  after(() => sinon.restore());

  afterEach(() => {
    executeStub.resetHistory();
    if (checkIngredientsExistsStub) checkIngredientsExistsStub.resetHistory();
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
      executeStub.resetHistory();
    });

    context('when it is called with ingredients and doughs included', () => {
      before(() => {
        inputId = '1';
        inputQuery = { include: ['dough', 'ingredients'] };
      });
      context('when the database returns valid results for doughs, ingredients, and pizzas', () => {
        before(() => {
          executeStub = sinon.stub().resolves(fullRawPizzaReturn);
        });

        it('calls the database once with the correct query to fetch a pizza', () => {
          executeStub.should.have.been.calledWith(
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
          executeStub = sinon.stub();
          executeStub.onCall(0).returns(emptyDbReturn);
        });

        it('returns null', () => {
          should.equal(result, null);
        });
      });
      context('when the database returns no ingredient results', () => {
        before(() => {
          executeStub = sinon.stub().resolves(rawPizzaReturnNullIngredients);
        });

        it('generates a raw pizza with ingredients as an empty array', () => {
          serializePizzaStub.getCall(0).args[0].ingredients.should.deep.equal([]);
        });
      });
      context('when the database returns no dough results', () => {
        before(() => {
          executeStub = sinon.stub().resolves(rawPizzaReturnNullDough);
        });

        it('generates a raw pizza with dough as an empty object', () => {
          serializePizzaStub.getCall(0).args[0].dough.should.deep.equal({});
        });
      });
    });
    context('when it is called with only ingredients included', () => {
      before(() => {
        inputQuery = { include: ['ingredients'] };
        executeStub = sinon.stub().resolves(rawPizzaReturnWithoutDough);
      });

      it('does not query the database for doughs', () => {
        executeStub.should.have.been.calledWith(
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
        executeStub = sinon.stub().resolves(rawPizzaReturnWithoutIngredients);
      });

      it('does not query the database for ingredients', () => {
        executeStub.should.have.been.calledWith(
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
        executeStub = sinon.stub()
          .resolves(rawPizzaReturnWithoutIngredientsOrDough);
      });

      it('does not query the database for ingredients or doughs', () => {
        executeStub.should.have.been.calledWith(
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
      executeStub = sinon.stub().resolves(rawPizzaReturnWithoutIngredientsOrDough);
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
        executeStub.should.have.been.calledWith(
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
        executeStub.should.have.been.calledWith(
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
        executeStub.should.have.been.calledWith(
          getPizzasWithIngredientsAndDoughsQuery,
          {},
        );
      });

      context('when the database returns multiple results', () => {
        before(() => {
          executeStub.returns(fullRawPizzasReturn);
        });

        it('sends two pizza records to the serializer', () => {
          serializePizzasStub.should.have.been.calledWith(
            [fullRawPizza, secondRawPizza],
          );
        });
      });

      context('when the database returns no results', () => {
        before(() => {
          executeStub.returns(emptyDbReturn);
        });

        it('sends an empty array to the serializer', () => {
          serializePizzasStub.should.have.been.calledWith([]);
        });
      });
    });

    context('when only dough is included', () => {
      before(() => {
        inputQuery = { include: ['dough'] };
        executeStub.returns(rawPizzaOnlyDoughReturn);
      });

      it('queries the database for doughs only', () => {
        executeStub.should.have.been.calledWith(
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
        executeStub.returns(rawPizzaOnlyIngredientsReturn);
      });

      it('queries the database for ingredients only', () => {
        executeStub.should.have.been.calledWith(
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
        executeStub.returns(rawPizzaNoDoughOrIngredients);
        checkIngredientsExistsStub = sinon.stub().returns(true);
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
      executeStub = sinon.stub().returns(postPizzaData.validQueryReturn);
      checkIngredientsExistsStub = sinon.stub().returns(true);
    });

    beforeEach(async () => {
      pizzasDao = proxyquirePizzasDao();
      try {
        result = await pizzasDao.postPizza(inputBody);
      } catch (e) {
        resultError = e;
      }
    });

    context('when it gets a body with valid attributes and no relationships', () => {
      before(() => {
        inputBody = postPizzaData.validBody;
      });

      it('calls the database with the right query and bind params', () => {
        executeStub.should.have.been.calledWith(
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

      it('does not call checkIngredientsExist', () => {
        checkIngredientsExistsStub.should.not.have.been.called;
      });

      it('only queries the database once', () => {
        executeStub.should.have.been.calledOnce;
      });
    });

    context('when it gets a body with an ingredients property', () => {
      before(() => {
        inputBody = postPizzaData.validBody;
        inputBody.data.relationships = { ingredients: postPizzaData.testIngredientsData };
      });

      it('checks if the ingredients exist with checkIngredientsExist', () => {
        checkIngredientsExistsStub.should.have.been.calledWith(['1']);
      });

      it('calls the database again to insert ingredient data', () => {
        executeStub.should.have.been.calledTwice;
        executeStub.getCall(1).should.have.been.calledWith(
          postPizzaData.insertSingleIngredientQuery,
          { pizzaId: 82, ingredientId1: 1 },
          { autoCommit: true },
        );
      });

      context('when the ingredient id is invalid', () => {
        before(() => {
          checkIngredientsExistsStub.returns(false);
        });

        it('throws an error', () => {
          resultError.should.be.a('ResourceRelationNotFoundError');
        });

        it('does not call the database', () => {
          executeStub.should.not.have.been.called;
        });
      });
    });

    context('when it gets a body with a dough relationship', () => {
      before(() => {
        inputBody = postPizzaData.validBody;
        inputBody.data.relationships = { dough: postPizzaData.testDoughData };
      });

      it('populates doughId with the dough id', () => {
        executeStub.should.have.been.calledWith(
          postPizzaData.postPizzaQuery,
          postPizzaData.postPizzaBindParamsWithDough,
          { autoCommit: true },
        );
      });

      context('when the dough id is invalid and the database throws an error', () => {
        before(() => {
          executeStub.throws(postPizzaData.oracleDbDoughError);
        });
        it('returns null', () => {
          should.equal(result, null);
        });
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
        executeStub.should.not.have.been.called;
      });
    });
  });
  context('updatePizzaById', () => {
    let inputBody;

    before(() => {
      serializePizzaStub = sinon.stub().returns(baseSerializerReturn);
      executeStub = sinon.stub().returns(postPizzaData.validQueryReturn);
      checkIngredientsExistsStub = sinon.stub().returns(true);
    });

    beforeEach(async () => {
      pizzasDao = proxyquirePizzasDao();
      try {
        result = await pizzasDao.updatePizzaById(inputBody);
      } catch (e) {
        resultError = e;
      }
    });

    context('when it get a body with valid data', () => {
      context('when it gets attributes to update for the pizza', () => {
        before(() => {
          inputBody = updatePizzaByIdData.pizzaBodyWithAttributes;
        });

        it('queries the database once', () => {
          executeStub.should.have.been.calledOnce;
        });
        it('generates the right query and bind params', () => {
          executeStub.getCall(0).should.have.been.calledWith(
            updatePizzaByIdData.updateNameQuery,
            updatePizzaByIdData.updateNameBindParams,
            { autoCommit: true },
          );
        });
        it('normalizes the out binds correctly', () => {
          serializePizzaStub.should.have.been.calledWith(postPizzaData.normalizedDbReturn);
        });
        it('returns the result of the serializer', () => {
          result.should.deep.equal(baseSerializerReturn);
        });
        context('when the pizza ID is invalid', () => {
          before(() => {
            executeStub.returns(emptyDbReturn);
          });
          it('throws an error', () => {
            resultError.should.be.a('ResourceNotFoundError');
          });
        });
      });
      context('when it gets a dough relationship to update', () => {
        before(() => {
          inputBody = updatePizzaByIdData.updateDoughBody;
        });
        it('queries the database once', () => {
          executeStub.should.have.been.calledOnce;
        });
        it('generates the right query and bind params', () => {
          executeStub.getCall(0).should.have.been.calledWith(
            updatePizzaByIdData.updateDoughQuery,
            updatePizzaByIdData.updateDoughBindParams,
            { autoCommit: true },
          );
        });
        context('when the dough ID is invalid', () => {
          before(() => {
            executeStub = sinon.stub().rejects(postPizzaData.oracleDbDoughError);
          });
          it('throws an error', () => {
            resultError.should.be.a('ResourceRelationNotFoundError');
            resultError.relation.should.equal('dough');
            resultError.ids.should.deep.equal(['1']);
          });
        });
      });
      context('when it gets ingredients relationships to update', () => {
        before(() => {
          executeStub = sinon.stub().returns(postPizzaData.validQueryReturn);
          inputBody = updatePizzaByIdData.updateIngredientsBody;
          checkIngredientsExistsStub = sinon.stub().returns(true);
        });

        it('checks if the ingredient IDs are valid', () => {
          checkIngredientsExistsStub.should.have.been.calledWith(['1']);
        });

        context('when the ingredient IDs are valid', () => {
          before(() => {
            checkIngredientsExistsStub = sinon.stub().returns(true);
          });

          it('calls the database three times', () => {
            executeStub.should.have.been.calledThrice;
          });

          it('deletes pizza ingredients in the second query', () => {
            executeStub.getCall(1).should.have.been.calledWith(
              updatePizzaByIdData.deleteIngredientsQuery,
              { pizzaId: 82 },
              { autoCommit: true },
            );
          });
          it('inserts new pizza ingredients records in the third query', () => {
            executeStub.getCall(2).should.have.been.calledWith(
              updatePizzaByIdData.bulkInsertIngredientsQuery,
              { ingredientId1: 1, pizzaId: 82 },
              { autoCommit: true },
            );
          });
        });

        context('when the ingredient IDs are invalid', () => {
          before(() => {
            checkIngredientsExistsStub = sinon.stub().returns(false);
          });
          it('throws an error', () => {
            resultError.should.be.a('ResourceRelationNotFoundError');
            resultError.relation.should.equal('ingredients');
          });
        });
      });

      context('when it gets only an empty attributes key', () => {
        before(() => {
          inputBody = updatePizzaByIdData.emptyBody;
        });
        it('calls the database with a select instead of insert', () => {
          executeStub.should.have.been.calledWith(
            updatePizzaByIdData.getPizzaQuery,
            { pizzaId: '1' },
          );
        });
        context('when the pizza exists', () => {
          before(() => {
            executeStub.returns(rawPizzaReturnWithoutIngredientsOrDough);
          });
          it('normalizes the pizza return and passes it to the serializer', () => {
            serializePizzaStub.should.have.been.calledWith(
              _.omit(fullRawPizza, 'dough', 'ingredients'),
              'pizzas/1',
            );
          });
          it('returns the result of the serialize', () => {
            result.should.equal(baseSerializerReturn);
          });
        });
        context('when the pizza does not exist', () => {
          before(() => {
            executeStub.returns(emptyDbReturn);
          });
          it('throws an error', () => {
            resultError.should.be.a('ResourceNotFoundError');
          });
        });
      });
    });
  });
});
