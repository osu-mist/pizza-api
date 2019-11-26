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
let doughSerializer;

const {
  nullSpecialInstructionsDough,
  emptyStringSpecialInstructionsDough,
} = doughSerializerData;

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
      beforeEach(() => {
        rawDough = nullSpecialInstructionsDough;
      });
      it('converts specialInstructions to an empty string', () => {
        const serializedDough = doughSerializer.serializeDough(rawDough);
        serializedDough.data.attributes.specialInstructions.should.equal('');
      });
    });
    describe('when it gets a dough with specialInstructions = \'\'', () => {
      beforeEach(() => {
        rawDough = emptyStringSpecialInstructionsDough;
      });
      it('leaves specialInstructions as an empty string', () => {
        const serializedDough = doughSerializer.serializeDough(rawDough);
        serializedDough.data.attributes.specialInstructions.should.equal('');
      });
    });
    describe('when it gets a raw dough with a valid format', () => {
      beforeEach(() => {
        rawDough = emptyStringSpecialInstructionsDough;
      });
      it('adds a top level self link', () => {
        const serializedDough = doughSerializer.serializeDough(rawDough, 'doughs');
        serializedDough.links.self.should.equal('/v1/doughs');
      });
      it('adds type and id at the top level of data', () => {
        const serializedDough = doughSerializer.serializeDough(rawDough, 'doughs');
        serializedDough.data.type.should.equal('dough');
        serializedDough.data.id.should.equal('201');
      });
      it('adds all of the right attributes to `attributes`', () => {
        const serializedDough = doughSerializer.serializeDough(rawDough, 'doughs');
        _.forIn(doughAttributes, (value, attribute) => {
          serializedDough.data.attributes.should.have.property(attribute);
        });
        serializedDough.data.attributes.should.not.have.property('id');
      });
    });
  });
  describe('serializeDoughs', () => {
    describe('when it gets a dough object array with valid formatting', () => {
      beforeEach(() => {
        rawDoughs = [
          emptyStringSpecialInstructionsDough,
        ];
      });
      it('returns an object with a data member that is an array', () => {
        const serializedDoughs = doughSerializer.serializeDoughs(rawDoughs, 'doughs');
        serializedDoughs.data.should.be.a('array');
      });
      it('populates the right attributes for each member of the data list', () => {
        const serializedDoughs = doughSerializer.serializeDoughs(rawDoughs, 'doughs');
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
      it('creates a top level link when no parameters are passed', () => {
        const serializedDoughs = doughSerializer.serializeDoughs(rawDoughs, '');
        serializedDoughs.links.self.should.equal('/v1/doughs');
      });
      it('creates a top level link with parameters when parameters are passed', () => {
        const serializedDoughs = doughSerializer.serializeDoughs(rawDoughs, { id: 1 });
        serializedDoughs.links.self.should.equal('/v1/doughs?id=1');
      });
    });
    describe('when it gets a doughs array with `specialInstructions` = null', () => {
      beforeEach(() => {
        rawDoughs = [
          nullSpecialInstructionsDough,
        ];
      });
      it('replaces null with \'\'', () => {
        const serializedDoughs = doughSerializer.serializeDoughs(rawDoughs);
        serializedDoughs.data[0].attributes.specialInstructions.should.equal('');
      });
    });
  });
});
