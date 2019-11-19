import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import config from 'config';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { getDoughsData } from './test-data';

sinon.replace(config, 'get', () => ({ oracledb: {} }));

const should = chai.should();
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
  let serializeDoughStub;
  let getConnectionStub;
  let connectionSpy;
  let doughsDao;
  beforeEach(() => {
    connectionSpy = sinon.stub().returns(executeReturn);
    serializeDoughsStub = sinon.stub().returns(baseGetDoughsReturn);
    serializeDoughStub = sinon.stub().returns(baseGetDoughsReturn);
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

  describe('postDoughs', () => {
    let result;
    beforeEach(() => {
      connectionSpy = sinon.stub().returns({
        outBinds: {
          idOut: [201],
          nameOut: ['weeknight pizza dough'],
          gramsFlourOut: [500],
          flourTypeOut: ['All Purpose'],
          gramsWaterOut: [400],
          waterTempOut: [90],
          gramsYeastOut: [5],
          gramsSaltOut: [15],
          gramsSugarOut: [0],
          gramsOliveOilOut: [0],
          bulkFermentTimeOut: [60],
          proofTimeOut: [15],
          specialInstructionsOut: [null],
        },
      });
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
          serializeDough: serializeDoughStub,
        },
      });
    });
    describe('when it gets valid params', () => {
      beforeEach(async () => {
        await doughsDao.postDough(
          {
            data:
            {
              type: 'dough',
              attributes:
               {
                 name: 'weeknight pizza dough',
                 gramsFlour: 500,
                 flourType: 'All Purpose',
                 gramsWater: 400,
                 waterTemp: 90,
                 gramsYeast: 5,
                 gramsSalt: 15,
                 bulkFermentTime: 60,
                 proofTime: 15,
                 gramsSugar: 0,
                 gramsOliveOil: 0,
                 specialInstructions: '',
               },
            },
          },
        );
      });
      it('generates the right bind params', () => {
        connectionSpy.should.have.been.calledWith(
          `INSERT INTO DOUGHS (NAME, GRAMS_FLOUR, FLOUR_TYPE, GRAMS_WATER, WATER_TEMP, GRAMS_YEAST, GRAMS_SALT, GRAMS_SUGAR, GRAMS_OLIVE_OIL, BULK_FERMENT_TIME, PROOF_TIME, SPECIAL_INSTRUCTIONS) VALUES (:name, :gramsFlour, :flourType, :gramsWater, :waterTemp, :gramsYeast, :gramsSalt, :gramsSugar, :gramsOliveOil, :bulkFermentTime, :proofTime, :specialInstructions) 
   RETURNING ID, NAME, GRAMS_FLOUR, FLOUR_TYPE, GRAMS_WATER, WATER_TEMP, GRAMS_YEAST, GRAMS_SALT, GRAMS_SUGAR, GRAMS_OLIVE_OIL, BULK_FERMENT_TIME, PROOF_TIME, SPECIAL_INSTRUCTIONS INTO :idOut, :nameOut, :gramsFlourOut, :flourTypeOut, :gramsWaterOut, :waterTempOut, :gramsYeastOut, :gramsSaltOut, :gramsSugarOut, :gramsOliveOilOut, :bulkFermentTimeOut, :proofTimeOut, :specialInstructionsOut`,
          {
            idOut: { type: 2002, dir: 3003 },
            nameOut: { type: 2001, dir: 3003 },
            gramsFlourOut: { type: 2002, dir: 3003 },
            flourTypeOut: { type: 2001, dir: 3003 },
            gramsWaterOut: { type: 2002, dir: 3003 },
            waterTempOut: { type: 2002, dir: 3003 },
            gramsYeastOut: { type: 2002, dir: 3003 },
            gramsSaltOut: { type: 2002, dir: 3003 },
            gramsSugarOut: { type: 2002, dir: 3003 },
            gramsOliveOilOut: { type: 2002, dir: 3003 },
            bulkFermentTimeOut: { type: 2002, dir: 3003 },
            proofTimeOut: { type: 2002, dir: 3003 },
            specialInstructionsOut: { type: 2001, dir: 3003 },
            name: 'weeknight pizza dough',
            gramsFlour: 500,
            flourType: 'All Purpose',
            gramsWater: 400,
            waterTemp: 90,
            gramsYeast: 5,
            gramsSalt: 15,
            bulkFermentTime: 60,
            proofTime: 15,
            gramsSugar: 0,
            gramsOliveOil: 0,
            specialInstructions: '',
          },
          { autoCommit: true },
        );
      });
      it('passes the right values to serializeDough', () => {
        serializeDoughStub.should.have.been.calledWith({
          name: 'weeknight pizza dough',
          id: 201,
          gramsFlour: 500,
          flourType: 'All Purpose',
          gramsWater: 400,
          waterTemp: 90,
          gramsYeast: 5,
          gramsSalt: 15,
          bulkFermentTime: 60,
          proofTime: 15,
          gramsSugar: 0,
          gramsOliveOil: 0,
          specialInstructions: null,
        },
        'doughs/');
      });
      it('returns the output of serializeDough', async () => {
        result = doughsDao.postDough(
          {
            data:
            {
              type: 'dough',
              attributes:
               {
                 name: 'weeknight pizza dough',
                 gramsFlour: 500,
                 flourType: 'All Purpose',
                 gramsWater: 400,
                 waterTemp: 90,
                 gramsYeast: 5,
                 gramsSalt: 15,
                 bulkFermentTime: 60,
                 proofTime: 15,
                 gramsSugar: 0,
                 gramsOliveOil: 0,
                 specialInstructions: '',
               },
            },
          },
        );
        return result.should.eventually.deep.equal(baseGetDoughsReturn);
      });
    });
    describe('when it gets invalid params', () => {
      // idk what to do here
      it('throws an error', () => should.Throw(() => doughsDao.postDough({
        data:
            {
              type: 'dough',
              attributes:
               {
                 foo: 'bar',
               },
            },
      })));
    });
  });
});
