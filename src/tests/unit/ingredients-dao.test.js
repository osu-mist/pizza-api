import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import config from 'config';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { openapi } from 'utils/load-openapi';
import { GetFilterProcessor } from 'utils/process-get-filters';

const ingredientsGetParameters = openapi.paths['/ingredients'].get.parameters;

sinon.restore();

sinon.replace(config, 'get', () => ({ oracledb: {} }));

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('test ingredients dao', () => {
  let serializeIngredientsStub;
  let getConnectionStub;
  let connectionSpy;
  let ingredientsDao;
  let getFilterProcessorStub;
  let getFilterProcessorContructorStub;
  beforeEach(() => {
    connectionSpy = sinon.stub().returns({ rows: ['a', 'b', 'c'] });
    serializeIngredientsStub = sinon.stub().returns({ test: true });
    getConnectionStub = sinon.stub().resolves({
      execute: connectionSpy,
      close: () => {},
    });
    getFilterProcessorContructorStub = sinon.stub();
    getFilterProcessorStub = sinon.stub(GetFilterProcessor.prototype, 'processGetFilters').returns({
      bindParams: { test: true },
      conditionals: 'TEST = :test',
    });

    Object.setPrototypeOf(GetFilterProcessor, getFilterProcessorContructorStub);

    ingredientsDao = proxyquire('../../api/v1/db/oracledb/ingredients-dao', {
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
      ingredientsDao = proxyquire('../../api/v1/db/oracledb/ingredients-dao', {
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
    it('passes the right values to the GetFilterProcessor constructor', async () => {
      getFilterProcessorContructorStub.callCount.should.equal(1);
      getFilterProcessorContructorStub.should.have.been.calledWith(
        ingredientsGetParameters,
        {
          id: 'ID',
          ingredientType: 'TYPE',
          name: 'NAME',
          notes: 'NOTES',
        },
      );
    });
  });
  describe('getIngredients', () => {
    describe('when called with filters', () => {
      let result;
      beforeEach(async () => {
        result = await ingredientsDao.getIngredients({
          'filter[name]': 'cheddar',
          invalidFilter: 'foo',
        });
      });
      it('passes those filters to processGetFilters', () => {
        getFilterProcessorStub.should.have.been.calledWith({
          'filter[name]': 'cheddar',
          invalidFilter: 'foo',
        });
      });
      it('passes the right conditionals and bind params to connection.execute', () => {
        connectionSpy.should.have.been.calledWith(
          'SELECT ID AS "id", TYPE AS "ingredientType", NAME AS "name", NOTES AS "notes" FROM INGREDIENTS WHERE TEST = :test',
          { test: true },
        );
      });
      it('extracts rows from the return of execute and passes them to serializeIngredients', () => {
        serializeIngredientsStub.should.have.been.calledWith(['a', 'b', 'c']);
      });
      it('returns the results of serializeIngredients', () => {
        result.should.deep.equal({ test: true });
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
        connectionSpy.should.have.been.calledWith(
          'SELECT ID AS "id", TYPE AS "ingredientType", NAME AS "name", NOTES AS "notes" FROM INGREDIENTS WHERE TEST = :test',
          { test: true },
        );
      });
      it('extracts rows from the return of execute and passes them to serializeIngredients', () => {
        serializeIngredientsStub.should.have.been.calledWith(['a', 'b', 'c']);
      });
      it('returns the results of serializeIngredients', () => {
        result.should.deep.equal({ test: true });
      });
    });
  });
});
