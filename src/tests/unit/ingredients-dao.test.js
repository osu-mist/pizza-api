import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import config from 'config';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { getIngredientsData } from 'tests/unit/test-data';
import { openapi } from 'utils/load-openapi';
import { GetFilterProcessor } from 'utils/process-get-filters';

const ingredientsGetParameters = openapi.paths['/ingredients'].get.parameters;

sinon.restore();

sinon.replace(config, 'get', () => ({ oracledb: {} }));

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('test ingredients dao', () => {
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
  let serializeIngredientsStub;
  let getConnectionStub;
  let connectionStub;
  let ingredientsDao;
  let getFilterProcessorStub;
  let getFilterProcessorContructorStub;
  beforeEach(() => {
    connectionStub = sinon.stub().returns(testConnectionReturn);
    serializeIngredientsStub = sinon.stub().returns(testSerializerReturn);
    getConnectionStub = sinon.stub().resolves({
      execute: connectionStub,
      close: () => {},
    });
    getFilterProcessorContructorStub = sinon.stub();
    getFilterProcessorStub = sinon.stub(GetFilterProcessor.prototype, 'processGetFilters').returns({
      bindParams: testBindParams,
      conditionals: testConditionals,
    });

    Object.setPrototypeOf(GetFilterProcessor, getFilterProcessorContructorStub);

    ingredientsDao = proxyquire('api/v1/db/oracledb/ingredients-dao', {
      './connection': {
        getConnection: getConnectionStub,
      },
      '../../serializers/ingredients-serializer': {
        serializeIngredients: serializeIngredientsStub,
      },
    });
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
    it('passes the right values to the GetFilterProcessor constructor', () => {
      getFilterProcessorContructorStub.callCount.should.equal(1);
      getFilterProcessorContructorStub.should.have.been.calledWith(
        ingredientsGetParameters,
        ingredientAliases,
      );
    });
  });
  describe('getIngredients', () => {
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
      it('correctly generates the SQL query and bind params', () => {
        connectionStub.should.have.been.calledWith(
          emptyGetIngredientsQuery,
          {},
        );
      });
    });
  });
});
