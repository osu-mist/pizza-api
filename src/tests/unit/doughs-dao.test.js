import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import config from 'config';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import {
  getDoughsData, postDoughsData, getDoughByIdData, updateDoughsByIdData,
} from './test-data';

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

const {
  getDoughByIdQuery,
  emptyDatabaseReturn,
  singleRecordDatabaseReturn,
  singleRecord,
} = getDoughByIdData;

const {
  dbReturnWithDifferentId,
  doughsOutBinds,
  doughPatchBodyWithInvalidAttribute,
  doughsPatchBodyWithEmptyAttributes,
  doughPatchBodyWithName,
  updateDoughNameQuery,
} = updateDoughsByIdData;

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
    sinon.replace(config, 'get', () => ({ oracledb: {} }));
    serializeDoughsStub = sinon.stub().returns(baseGetDoughsReturn);
    serializeDoughStub = sinon.stub().returns(baseGetDoughsReturn);
    connectionStub = sinon.stub().returns(executeReturn);
  });
  afterEach(() => {
    sinon.restore();
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
          .should.have.been
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
  context('getDoughById', () => {
    let result;
    beforeEach(() => {
      connectionStub = sinon.stub().returns(singleRecordDatabaseReturn);
      doughsDao = proxyquireDoughsDao(
        connectionStub,
        serializeDoughsStub,
        serializeDoughStub,
      );
    });
    context('when called with an integer-formatted id', () => {
      beforeEach(async () => {
        result = doughsDao.getDoughById('1');
        await result;
      });

      it('calls execute with the right query and bind params', () => {
        connectionStub.should.have.been.calledWith(
          getDoughByIdQuery,
          { id: '1' },
        );
      });

      it('extracts rows from the return and passes them to the serializer', () => {
        serializeDoughStub.should.have.been.calledWith(
          singleRecord,
          'doughs/1',
        );
      });

      it('returns the result from the serializer', async () => result
        .should.eventually.deep.equal(baseGetDoughsReturn));

      context('when the database returns an empty result', () => {
        beforeEach(async () => {
          connectionStub = sinon.stub().returns(emptyDatabaseReturn);
          serializeDoughStub = sinon.stub();
          doughsDao = proxyquireDoughsDao(connectionStub, serializeDoughsStub, serializeDoughStub);
          await doughsDao.getDoughById('1');
        });

        it("doesn't pass a value to the serializer", () => {
          serializeDoughStub.should.not.have.been.called;
        });
      });
      context('when the database returns multiple results', () => {
        beforeEach(async () => {
          connectionStub = sinon.stub().returns(executeReturn);
          doughsDao = proxyquireDoughsDao(connectionStub, serializeDoughsStub, serializeDoughStub);
          result = doughsDao.getDoughById('1');
        });
        it('throws an error', () => {
          result.should.be.rejectedWith('Got multiple values with the same ID');
        });
      });
    });
  });
  context('updateDoughById', () => {
    let result;
    context('when it gets input with an empty attributes key', () => {
      beforeEach(async () => {
        connectionStub = sinon.stub().returns(singleRecordDatabaseReturn);
        doughsDao = proxyquireDoughsDao(connectionStub, serializeDoughsStub, serializeDoughStub);
        result = doughsDao.updateDoughById(doughsPatchBodyWithEmptyAttributes);
        await result;
      });
      it('executes a SELECT query against the database', () => {
        connectionStub.should.have.been.called;
        connectionStub.should.have.been.calledWith(
          getDoughByIdQuery,
          { id: '201' },
        );
      });
    });
    context('when it gets input with at least one valid attribute', () => {
      beforeEach(async () => {
        connectionStub = sinon.stub().returns(testDbReturn);
        doughsDao = proxyquireDoughsDao(connectionStub, serializeDoughsStub, serializeDoughStub);
        result = doughsDao.updateDoughById(doughPatchBodyWithName);
        await result;
      });
      afterEach(() => {
        connectionStub.reset();
      });
      it('executes an UPDATE query with only the right attributes', () => {
        connectionStub.should.have.been.calledWith(
          updateDoughNameQuery,
          {
            ...doughsOutBinds,
            id: '201',
            name: 'test',
          },
          { autoCommit: true },
        );
      });
      it('correctly normalizes the outbinds in the database return', () => {
        serializeDoughStub.should.have.been.calledWith(
          normalizedDough,
          'doughs/201',
        );
      });
      it('returns the result from the serializer',
        () => result.should.eventually.deep.equal(baseGetDoughsReturn));
      context('when the normalized value has a different ID from the input', () => {
        beforeEach(async () => {
          connectionStub.returns(dbReturnWithDifferentId);
          result = doughsDao.updateDoughById(doughPatchBodyWithName);
        });
        it('throws an error', () => {
          result.should.be.rejectedWith('ID returned from database does not match input ID');
        });
      });
    });
    context('when it gets an attribute not in doughsProperties', () => {
      beforeEach(async () => {
        connectionStub = sinon.stub().returns(singleRecordDatabaseReturn);
        doughsDao = proxyquireDoughsDao(connectionStub, serializeDoughsStub, serializeDoughStub);
        result = doughsDao.updateDoughById(doughPatchBodyWithInvalidAttribute);
      });
      it('throws an error', () => result.should.be.rejectedWith('Invalid attribute'));
      it('does not call the database', async () => {
        try {
          await result;
        } catch {
          connectionStub.should.not.have.been.called;
        }
      });
    });
  });
});
