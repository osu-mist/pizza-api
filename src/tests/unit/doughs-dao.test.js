import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { getDoughsData } from './test-data';

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('test doughs dao', () => {
  let serializeDoughsStub;
  let getConnectionStub;
  let connectionSpy;
  let doughsDao;
  beforeEach(() => {
    connectionSpy = sinon.stub().returns(getDoughsData.executeReturn);
    serializeDoughsStub = sinon.stub().returns(getDoughsData.baseGetDoughsReturn);
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
      serializeDoughsStub.getCall(0).calledWith(getDoughsData.executeReturnRows).should.be.true;
    });
    describe('when it has an invalid filter', () => {
      it('does not parse the invalid filter', async () => {
        await doughsDao.getDoughs(getDoughsData.invalidFilters);
        connectionSpy
          .getCall(0)
          .should.have.been
          .calledWith(
            getDoughsData.getDoughsQuery,
            getDoughsData.emptyBindParams,
          );
      });
    });
    describe('when it gets different kinds of filters', () => {
      [{},
        getDoughsData.waterTempFilter,
        getDoughsData.mixedValidFilters,
        getDoughsData.multipleFilters]
        .forEach((filters) => {
          it('still returns the value of serializeDoughs', () => {
            const result = doughsDao.getDoughs(filters);
            return result.should.eventually.deep.equal(getDoughsData.baseGetDoughsReturn);
          });
        });
    });
    describe('when it has valid filters', () => {
      it('properly parses those filters into bind paramters', async () => {
        await doughsDao.getDoughs(getDoughsData.waterTempFilter);
        connectionSpy
          .getCall(0)
          .should.have.been
          .calledWith(
            getDoughsData.getDoughsQueryWithWaterTemp,
            getDoughsData.waterTempBindParams,
          );
      });
    });
    describe('when it gets valid and invalid filters', () => {
      it('only parses the valid filters into bind parameters', async () => {
        await doughsDao.getDoughs(getDoughsData.mixedValidFilters);
        connectionSpy
          .getCall(0)
          .should.have.been
          .calledWith(
            getDoughsData.getDoughsQueryWithWaterTemp,
            getDoughsData.waterTempBindParams,
          );
      });
    });
    describe('when it gets multiple valid filters', () => {
      it('properly parses all of those filters', async () => {
        await doughsDao.getDoughs(getDoughsData.multipleFilters);
        connectionSpy
          .getCall(0)
          .calledWith(
            getDoughsData.getDoughsQueryWithMultipleConditions,
            getDoughsData.multipleFiltersBindParams,
          ).should.be.true;
      });
    });
  });
});
