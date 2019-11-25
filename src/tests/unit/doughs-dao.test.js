import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import config from 'config';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { getDoughsData, postDoughsData } from './test-data';

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

const {
  doughsPostQuery,
  testDbReturn,
  sampleValidDoughData,
  doughsBindParams,
  normalizedDough,
  invalidDoughsData,
} = postDoughsData;

const proxyquireDoughsDao = (connectionStub, serializeDoughsStub, serializeDoughStub) => {
  const getConnectionStub = sinon.stub().resolves({
    execute: connectionStub,
    close: () => {},
  });

  return proxyquire('api/v1/db/oracledb/doughs-dao', {
    './connection': {
      getConnection: getConnectionStub,
    },
    '../../serializers/doughs-serializer': {
      serializeDoughs: serializeDoughsStub,
      serializeDough: serializeDoughStub,
    },
  });
};

describe('test doughs dao', () => {
  let serializeDoughsStub;
  let serializeDoughStub;
  let connectionStub;
  let doughsDao;
  beforeEach(() => {
    serializeDoughsStub = sinon.stub().returns(baseGetDoughsReturn);
    serializeDoughStub = sinon.stub().returns(baseGetDoughsReturn);
    sinon.replace(config, 'get', () => ({ oracledb: {} }));
    connectionStub = sinon.stub().returns(executeReturn);
    serializeDoughsStub = sinon.stub().returns(baseGetDoughsReturn);
  });
  describe('getDoughs', () => {
    beforeEach(() => {
      connectionStub = sinon.stub().returns(executeReturn);

      doughsDao = proxyquireDoughsDao(connectionStub, serializeDoughsStub, serializeDoughStub);
    });
    afterEach(() => {
      sinon.restore();
    });
    it('extracts only the rows from the database return', async () => {
      await doughsDao.getDoughs({});
      serializeDoughsStub.getCall(0).calledWith(executeReturnRows).should.be.true;
    });
    describe('when it has an invalid filter', () => {
      it('does not parse the invalid filter', async () => {
        await doughsDao.getDoughs(invalidFilters);
        connectionStub
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
        connectionStub
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
        connectionStub
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
        connectionStub
          .getCall(0)
          .calledWith(
            getDoughsQueryWithMultipleConditions,
            multipleFiltersBindParams,
          );
      });
    });
  });

  describe('postDoughs', () => {
    beforeEach(() => {
      connectionStub = sinon.stub().returns(testDbReturn);

      doughsDao = proxyquireDoughsDao(connectionStub, serializeDoughsStub, serializeDoughStub);
    });
    describe('when it gets valid params', () => {
      beforeEach(async () => {
        await doughsDao.postDough(sampleValidDoughData);
      });

      it('generates the right bind params based on the inputs', () => {
        connectionStub.should.have.been.calledWith(
          doughsPostQuery,
          doughsBindParams,
          { autoCommit: true },
        );
      });

      it('passes a normalized raw doughs object with the right values to serializeDough', () => {
        serializeDoughStub.should.have.been.calledWith(normalizedDough);
      });

      it('returns the output of serializeDough', async () => {
        const result = doughsDao.postDough(sampleValidDoughData);
        return result.should.eventually.deep.equal(baseGetDoughsReturn);
      });
    });
    describe('when it gets invalid params', () => {
      it('throws an error', () => doughsDao
        .postDough(invalidDoughsData).should.be.rejected);

      it('does not make a database call', async () => {
        try {
          await doughsDao.postDough(invalidDoughsData);
        } catch {
          connectionStub.should.not.have.been.called;
        }
      });
    });
  });
});
