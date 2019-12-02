import chai from 'chai';
import config from 'config';
import _ from 'lodash';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { openapi } from 'utils/load-openapi';
import { doughSerializerData } from './test-data';

const doughAttributes = openapi.definitions.DoughAttributes.properties;

chai.should();

let rawDough;
let rawDoughs;
let serializedDough;
let serializedDoughs;
let serializerResult;
let doughSerializer;

const {
  nullSpecialInstructionsDough,
  emptyStringSpecialInstructionsDough,
} = doughSerializerData;

const initializeSerializeDoughTest = (doughValue, ...serializerArgs) => {
  beforeEach(() => {
    rawDough = doughValue;
    serializedDough = doughSerializer.serializeDough(rawDough, ...serializerArgs);
    serializerResult = serializedDough;
  });
};

const initializeSerializeDoughsTest = (doughsValue, ...serializerArgs) => {
  beforeEach(() => {
    rawDoughs = doughsValue;
    serializedDoughs = doughSerializer.serializeDoughs(rawDoughs, ...serializerArgs);
    serializerResult = serializedDoughs;
  });
};

const itMakesSpecialInstructionsAnEmptyString = () => {
  it('makes special instructions an empty string', () => {
    serializedDough
      .data.attributes.specialInstructions.should.equal('');
  });
};

const itCreatesTheCorrectTopLevelLink = (desiredLink) => {
  it('create a correct top level link', () => {
    serializerResult.links.self.should.equal(desiredLink);
  });
};

describe('test doughs serializer', () => {
  before(() => {
    sinon.replace(config, 'get', () => ({ oracledb: {} }));
    // importing doughSerializer normally causes config to become unextensible,
    // which then breaks other tests. This prevents that problem, even though
    // stubbing imports is not required.
    doughSerializer = proxyquire('../../api/v1/serializers/doughs-serializer', {});
  });
  after(() => {
    sinon.restore();
  });
  describe('serializeDough', () => {
    describe('when it gets a dough object with specialInstructions = `null`', () => {
      initializeSerializeDoughTest(nullSpecialInstructionsDough);

      itMakesSpecialInstructionsAnEmptyString();
    });

    describe('when it gets a dough with specialInstructions = \'\'', () => {
      initializeSerializeDoughTest(emptyStringSpecialInstructionsDough);

      itMakesSpecialInstructionsAnEmptyString();
    });

    describe('when it gets a raw dough with a valid format', () => {
      initializeSerializeDoughTest(emptyStringSpecialInstructionsDough, 'doughs');

      itCreatesTheCorrectTopLevelLink('/v1/doughs');

      it('adds type and id at the top level of data', () => {
        serializedDough.data.type.should.equal('dough');
        serializedDough.data.id.should.equal('201');
      });

      it('adds all of the right attributes to `attributes`', () => {
        _.forIn(doughAttributes, (value, attribute) => {
          serializedDough.data.attributes.should.have.property(attribute);
        });
        serializedDough.data.attributes.should.not.have.property('id');
      });
    });
  });

  describe('serializeDoughs', () => {
    describe('when it gets a dough object array with valid formatting', () => {
      initializeSerializeDoughsTest([emptyStringSpecialInstructionsDough]);

      it('returns an object with a data member that is an array', () => {
        serializedDoughs.data.should.be.a('array');
      });

      it('populates the right attributes for each member of the data list', () => {
        serializedDoughs.data.forEach((dough, index) => {
          _.forIn(doughAttributes, (value, attribute) => {
            dough.attributes.should.have.property(attribute);
            dough.attributes[attribute].should.equal(rawDoughs[index][attribute]);
          });
          dough.attributes.should.not.have.property('id');
          dough.type.should.equal('dough');
          dough.id.should.equal(String(rawDoughs[index].id));
          dough.links.self.should.equal(`/v1/doughs/${rawDoughs[index].id}`);
        });
      });

      itCreatesTheCorrectTopLevelLink('/v1/doughs');

      describe('when parameters are passed to the serializer', () => {
        initializeSerializeDoughsTest([emptyStringSpecialInstructionsDough], { id: 1 });

        itCreatesTheCorrectTopLevelLink('/v1/doughs?id=1');
      });
    });
    describe('when it gets a doughs array with `specialInstructions` = null', () => {
      initializeSerializeDoughsTest([nullSpecialInstructionsDough]);

      it('replaces null with \'\'', () => {
        serializedDoughs.data[0].attributes.specialInstructions.should.equal('');
      });
    });
  });
});
