import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import config from 'config';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { getDoughsData } from './test-data';

sinon.replace(config, 'get', () => ({ oracledb: {} }));

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

const {
  executeReturn,
  baseGetDoughsReturn,
  executeReturnRows,
  invalidFilters,
  waterTempFilter,
  mixedValidFilters,
  multipleFilters,
  getDoughsQuery,
  getDoughsQueryWithMultipleConditions,
  getDoughsQueryWithWaterTemp,
  waterTempBindParams,
  multipleFiltersBindParams,
  emptyBindParams,
} = getDoughsData;

describe('test doughs dao', () => {
  let serializeDoughsStub;
  let getConnectionStub;
  let connectionSpy;
  let doughsDao;
  beforeEach(() => {
    connectionSpy = sinon.stub().returns(executeReturn);
    serializeDoughsStub = sinon.stub().returns(baseGetDoughsReturn);
    getConnectionStub = sinon.stub().resolves({
      execute: connectionSpy,
      close: () => {},
    });

    doughsDao = proxyquire('../../api/v1/db/oracledb/doughs-dao', {
      './connection': {
        getConnection: getConnectionStub,
      },
      '../../serializers/doughs-serializer': {
        serializeDoughs: serializeDoughsStub,
      },
    });
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('getDoughs', () => {
    it('extracts only the rows from the database return', async () => {
      await doughsDao.getDoughs({});
      serializeDoughsStub.getCall(0).calledWith(executeReturnRows).should.be.true;
    });
    describe('when it has an invalid filter', () => {
      it('does not parse the invalid filter', async () => {
        await doughsDao.getDoughs(invalidFilters);
        connectionSpy
          .getCall(0)
          .should.have.been
          .calledWith(
            getDoughsQuery,
            emptyBindParams,
          );
      });
    });
    describe('when it gets different kinds of filters', () => {
      [{},
        waterTempFilter,
        mixedValidFilters,
        multipleFilters]
        .forEach((filters) => {
          it('still returns the value of serializeDoughs', () => {
            const result = doughsDao.getDoughs(filters);
            return result.should.eventually.deep.equal(baseGetDoughsReturn);
          });
        });
    });
    describe('when it has valid filters', () => {
      it('properly parses those filters into bind parameters', async () => {
        await doughsDao.getDoughs(waterTempFilter);
        connectionSpy
          .getCall(0)
          .should.have.been
          .calledWith(
            getDoughsQueryWithWaterTemp,
            waterTempBindParams,
          );
      });
    });
    describe('when it gets valid and invalid filters', () => {
      it('only parses the valid filters into bind parameters', async () => {
        await doughsDao.getDoughs(mixedValidFilters);
        connectionSpy
          .getCall(0)
          .should.have.been
          .calledWith(
            getDoughsQueryWithWaterTemp,
            waterTempBindParams,
          );
      });
    });
    describe('when it gets multiple valid filters', () => {
      it('properly parses all of those filters', async () => {
        await doughsDao.getDoughs(multipleFilters);
        connectionSpy
          .getCall(0)
          .calledWith(
            getDoughsQueryWithMultipleConditions,
            multipleFiltersBindParams,
          ).should.be.true;
      });
    });
  });
});
