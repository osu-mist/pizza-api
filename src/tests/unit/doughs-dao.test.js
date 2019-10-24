import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

import * as connectionApi from 'api/v1/db/oracledb/connection';
import * as doughsSerializer from 'api/v1/serializers/doughs-serializer';
import { getDoughs } from 'api/v1/db/oracledb/doughs-dao';
import { getDoughsData } from './test-data';

chai.should();
chai.use(chaiAsPromised);

describe('test doughs dao', () => {
  let serializeDoughsStub;
  let getConnectionStub;
  let connectionSpy;
  beforeEach(() => {
    connectionSpy = sinon.stub().returns(getDoughsData.executeReturn);
    serializeDoughsStub = sinon.stub(doughsSerializer, 'serializeDoughs');
    getConnectionStub = sinon.stub(connectionApi, 'getConnection');
    getConnectionStub.resolves({
      execute: connectionSpy,
      close: () => { },
      commit: () => { },
    });
    serializeDoughsStub.returns(getDoughsData.baseGetDoughsReturn);
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('getDoughs', () => {
    it('returns the output from serializeDoughs', () => {
      const result = getDoughs({});
      return result.should.eventually.deep.equal(getDoughsData.baseGetDoughsReturn);
    });
    it('extracts only the rows from the database return', async () => {
      await getDoughs({});
      serializeDoughsStub.getCall(0).calledWith(getDoughsData.executeReturnRows).should.be.true;
    });
    describe('when it has an invalid filter', () => {
      it('does not parse the invalid filter', async () => {
        await getDoughs(getDoughsData.invalidFilters);
        connectionSpy
          .getCall(0)
          .calledWith(
            getDoughsData.getDoughsQuery,
            getDoughsData.emptyBindParams,
          ).should.be.true;
      });
    });
    describe('when it has valid filters', () => {
      it('properly parses those filters into bind paramters', async () => {
        await getDoughs(getDoughsData.waterTempFilter);
        connectionSpy
          .getCall(0)
          .calledWith(
            getDoughsData.getDoughsQueryWithWaterTemp,
            getDoughsData.waterTempBindParams,
          ).should.be.true;
      });
    });
    describe('when it gets valid and invalid filters', () => {
      it('only parses the valid filters into bind parameters', async () => {
        await getDoughs(getDoughsData.mixedValidFilters);
        connectionSpy
          .getCall(0)
          .calledWith(
            getDoughsData.getDoughsQueryWithWaterTemp,
            getDoughsData.waterTempBindParams,
          ).should.be.true;
      });
    });
    describe('when it gets multiple valid filters', () => {
      it('properly parses all of those filters', async () => {
        await getDoughs(getDoughsData.multipleFilters);
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
