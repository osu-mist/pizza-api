import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import config from 'config';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { getIngredientsData, postIngredientData } from 'tests/unit/test-data';
import { openapi } from 'utils/load-openapi';
import { GetFilterProcessor } from 'utils/process-get-filters';

const ingredientsGetParameters = openapi.paths['/ingredients'].get.parameters;

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

const proxyquireIngredientsDao = (
  connectionStub, serializeIngredientsStub, serializeIngredientStub,
) => {
  const getConnectionStub = sinon.stub().resolves({
    execute: connectionStub,
    close: () => {},
  });

  return proxyquire('api/v1/db/oracledb/ingredients-dao', {
    './connection': {
      getConnection: getConnectionStub,
    },
    '../../serializers/ingredients-serializer': {
      serializeIngredients: serializeIngredientsStub,
      serializeIngredient: serializeIngredientStub,
    },
  });
};

const {
  getIngredientsQuery,
  emptyGetIngredientsQuery,
  testFilters,
  ingredientAliases,
  testBindParams,
  testSerializerReturn,
  testConditionals,
  testConnectionReturn,
  testConnectionReturnRows,
} = getIngredientsData;

const {
  testDbReturn,
  sampleValidIngredientData,
  ingredientsPostQuery,
  ingredientsBindParams,
  normalizedIngredient,
  invalidIngredientsData,
} = postIngredientData;

describe('test ingredients dao', () => {
  let serializeIngredientsStub;
  let serializeIngredientStub;
  let getConnectionStub;
  let connectionStub;
  let ingredientsDao;
  let getFilterProcessorStub;
  let getFilterProcessorContructorStub;
  beforeEach(() => {
    sinon.replace(config, 'get', () => ({ oracledb: {} }));
    serializeIngredientsStub = sinon.stub().returns(testSerializerReturn);
    serializeIngredientStub = sinon.stub().returns(testSerializerReturn);

    getFilterProcessorContructorStub = sinon.stub();
    getFilterProcessorStub = sinon.stub(GetFilterProcessor.prototype, 'processGetFilters').returns({
      bindParams: testBindParams,
      conditionals: testConditionals,
    });

    Object.setPrototypeOf(GetFilterProcessor, getFilterProcessorContructorStub);
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('getIngredients', () => {
    beforeEach(() => {
      connectionStub = sinon.stub().returns(testConnectionReturn);
      ingredientsDao = proxyquireIngredientsDao(
        connectionStub, serializeIngredientsStub, serializeIngredientStub,
      );
    });
    afterEach(() => {
      sinon.restore();
    });

    describe('when the constructor for GetFilterProcessor is called', () => {
      beforeEach(() => {
        ingredientsDao = proxyquire('api/v1/db/oracledb/ingredients-dao', {
          './connection': {
            getConnection: getConnectionStub,
          },
          '../../serializers/ingredients-serializer': {
            serializeIngredients: serializeIngredientsStub,
          },
          '../../../../utils/process-get-filters': {
            GetFilterProcessor: getFilterProcessorContructorStub,
          },
        });
      });

      /*
       * if our filter processor is initialized correctly, we can be basically sure
       * that our filters will always be processed into bind params correctly
       */
      it('passes the right values to the GetFilterProcessor constructor', () => {
        getFilterProcessorContructorStub.callCount.should.equal(1);
        getFilterProcessorContructorStub.should.have.been.calledWith(
          ingredientsGetParameters,
          ingredientAliases,
        );
      });
    });

    describe('getIngredients', () => {
      /*
       * in the following two cases, we test to verify that our data flows smoothly
       * from the inputs (filters/no filters) -> the filter processor -> the db connection
       * -> the serializer -> back to the user
       */
      describe('when called with filters', () => {
        let result;

        beforeEach(async () => {
          result = await ingredientsDao.getIngredients(testFilters);
        });

        it('passes those filters to processGetFilters', () => {
          getFilterProcessorStub.should.have.been.calledWith(testFilters);
        });

        it('passes the right conditionals and bind params to connection.execute', () => {
          connectionStub.should.have.been.calledWith(
            getIngredientsQuery,
            testBindParams,
          );
        });

        it('extracts rows from the return of execute and passes them to serializeIngredients', () => {
          serializeIngredientsStub.should.have.been.calledWith(testConnectionReturnRows);
        });

        it('returns the results of serializeIngredients', () => {
          result.should.deep.equal(testSerializerReturn);
        });
      });
      describe('when called without filters', () => {
        let result;

        beforeEach(async () => {
          result = await ingredientsDao.getIngredients({});
        });

        it('passes no filters to processGetFilters', () => {
          getFilterProcessorStub.should.have.been.calledWith({});
        });

        it('passes the right conditionals and bind params to connection.execute', () => {
          connectionStub.should.have.been.calledWith(
            getIngredientsQuery,
            testBindParams,
          );
        });

        it('extracts rows from the return of execute and passes them to serializeIngredients', () => {
          serializeIngredientsStub.should.have.been.calledWith(testConnectionReturnRows);
        });

        it('returns the results of serializeIngredients', () => {
          result.should.deep.equal(testSerializerReturn);
        });
      });

      describe('when there are no conditionals', () => {
        beforeEach(async () => {
          getFilterProcessorStub.returns({ conditionals: '', bindParams: {} });
          await ingredientsDao.getIngredients({});
        });

        /*
         * testing to see that sql generation is done correctly when no parameters
         * are passed to the function
         */
        it('correctly generates the SQL query and bind params', () => {
          connectionStub.should.have.been.calledWith(
            emptyGetIngredientsQuery,
            {},
          );
        });
      });
    });
  });
  describe('postIngredient', () => {
    beforeEach(() => {
      connectionStub = sinon.stub().returns(testDbReturn);

      ingredientsDao = proxyquireIngredientsDao(
        connectionStub, serializeIngredientsStub, serializeIngredientStub,
      );
    });
    describe('when it gets valid params', () => {
      beforeEach(async () => {
        await ingredientsDao.postIngredient(sampleValidIngredientData);
      });

      it('generates the right bind params based on the inputs', () => {
        connectionStub.should.have.been.calledWith(
          ingredientsPostQuery,
          ingredientsBindParams,
          { autoCommit: true },
        );
      });

      it('passes a normalized raw ingredients object with the right values to serializeIngredient', () => {
        serializeIngredientStub.should.have.been.calledWith(normalizedIngredient, 'ingredients');
      });

      it('returns the output of serializeIngredient', async () => {
        const result = ingredientsDao.postIngredient(sampleValidIngredientData);
        return result.should.eventually.deep.equal(testSerializerReturn);
      });
    });
    describe('when it gets invalid params', () => {
      it('throws an error', () => ingredientsDao
        .postIngredient(invalidIngredientsData).should.be.rejected);

      it('does not make a database call', async () => {
        try {
          await ingredientsDao.postIngredient(invalidIngredientsData);
        } catch {
          connectionStub.should.not.have.been.called;
        }
      });
    });
  });
  context('getIngredientById', () => {
    context('when it gets an integer-formatted id', () => {
      context('when the database returns an empty result', () => {

      });
      context('when the database returns multiple results', () => {

      });
    });
  });
});
