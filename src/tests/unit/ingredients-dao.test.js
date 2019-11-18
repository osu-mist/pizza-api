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

describe('getIngredients', () => {
  let serializeIngredientsStub;
  let getConnectionStub;
  let connectionSpy;
  let ingredientsDao;
  let getFilterProcessorStub;
  let getFilterProcessorContructorStub;
  beforeEach(() => {
    connectionSpy = sinon.stub().returns({});
    serializeIngredientsStub = sinon.stub().returns({});
    getConnectionStub = sinon.stub().resolves({
      execute: connectionSpy,
      close: () => {},
    });
    getFilterProcessorContructorStub = sinon.stub();
    getFilterProcessorStub = sinon.stub().returns({
      bindParams: { test: true },
      conditionals: 'TEST = :test',
    });

    ingredientsDao = proxyquire('../../api/v1/db/oracledb/ingredients-dao', {
      './connection': {
        getConnection: getConnectionStub,
      },
      '../../serializers/ingredients-serializer': {
        serializeIngredients: serializeIngredientsStub,
      },
      '../../../../utils/process-get-filters.js': {
        GetFilterProcessor: {
          prototype: {
            constructor: getFilterProcessorContructorStub,
            processGetFilters: getFilterProcessorStub,
          },
        },
      },
    });
  });
  it('passes the right values to the GetFilterProcessor constructor', () => {
    getFilterProcessorContructorStub.getCall(0).calledWith(
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
