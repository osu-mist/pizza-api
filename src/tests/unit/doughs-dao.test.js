import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

import { getDoughs } from 'api/v1/db/oracledb/doughs-dao';
import * as doughsSerializer from 'api/v1/serializers/doughs-serializer';
import * as connectionApi from 'api/v1/db/oracledb/connection';
// import { connection } from 'oracledb';

chai.should();
chai.use(chaiAsPromised);

const baseGetDoughsReturn = {
  data: [],
};

describe('test doughs dao', () => {
  let serializeDoughsStub = null;
  let getConnectionStub = null;
  let connectionSpy = null;
  const getDoughsConditions = 'ID AS "id", NAME AS "name", GRAMS_FLOUR AS "gramsFlour", GRAMS_WATER AS "gramsWater", FLOUR_TYPE AS "flourType", WATER_TEMP AS "waterTemp", GRAMS_YEAST AS "gramsYeast", GRAMS_SALT AS "gramsSalt", GRAMS_SUGAR AS "gramsSugar", GRAMS_OLIVE_OIL AS "gramsOliveOil", BULK_FERMENT_TIME AS "bulkFermentTime", PROOF_TIME AS "proofTime", SPECIAL_INSTRUCTIONS AS "specialInstructions"';
  const getDoughsQuery = `SELECT ${getDoughsConditions} FROM DOUGHS `;
  const getDoughsQueryWithWaterTemp = `SELECT ${getDoughsConditions} FROM DOUGHS WHERE WATER_TEMP = :waterTemp ;`;
  const getDoughsQueryWithMultipleConditions = `SELECT ${getDoughsConditions} FROM DOUGHS WHERE WATER_TEMP = :waterTemp AND GRAMS_WATER = :gramsWater AND PROOF_TIME = :proofTime AND NAME = :name ;`;
  const executeReturnRows = ['a', 'b', 'c'];
  const executeReturn = { rows: executeReturnRows, metadata: 'ignore-this' };
  beforeEach(() => {
    connectionSpy = sinon.stub().returns(executeReturn);
    serializeDoughsStub = sinon.stub(doughsSerializer, 'serializeDoughs');
    getConnectionStub = sinon.stub(connectionApi, 'getConnection');
    getConnectionStub.resolves({
      execute: connectionSpy,
      close: () => { },
      commit: () => { },
    });
    serializeDoughsStub.returns(baseGetDoughsReturn);
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('getDoughs', () => {
    it('returns the output from serializeDoughs', () => {
      const result = getDoughs({});
      return result.should.eventually.deep.equal(baseGetDoughsReturn);
    });
    it('extracts only the rows from the database return', async () => {
      await getDoughs({});
      serializeDoughsStub.getCall(0).calledWith(executeReturnRows).should.equal(true);
    });
    describe('when it has an invalid filter', () => {
      it('does not parse the invalid filter', async () => {
        await getDoughs({ abc: 'def' });
        connectionSpy.getCall(0).calledWith(getDoughsQuery, {}).should.equal(true);
      });
    });
    describe('when it has valid filters', () => {
      it('properly parses those filters into bind paramters', async () => {
        await getDoughs({ 'filter[waterTemp]': 90 });
        connectionSpy.getCall(0).calledWith(getDoughsQueryWithWaterTemp, { waterTemp: 90 });
      });
    });
    describe('when it gets valid and invalid filters', () => {
      it('only parses the valid filters into bind parameters', async () => {
        await getDoughs({ 'filter[waterTemp]': 90, abc: 'def' });
        connectionSpy.getCall(0).calledWith(getDoughsQueryWithWaterTemp, { waterTemp: 90 });
      });
    });
    describe('when it gets multiple valid filters', () => {
      it('properly parses all of those filters', async () => {
        await getDoughs({
          'filter[waterTemp]': 90,
          'filter[gramsWater]': 200,
          'filter[proofTime]': 90,
          'filter[name]': 'Sample dough',
        });
        connectionSpy.getCall(0).calledWith(getDoughsQueryWithMultipleConditions, {
          waterTemp: 90,
          gramsWater: 200,
          proofTime: 90,
          name: 'Sample dough',
        });
      });
    });
  });
});
