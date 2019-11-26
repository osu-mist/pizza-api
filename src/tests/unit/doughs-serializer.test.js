import chai from 'chai';
import config from 'config';
import _ from 'lodash';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { openapi } from 'utils/load-openapi';

const doughAttributes = openapi.definitions.DoughAttributes.properties;

chai.should();

let rawDough;
let rawDoughs;
let doughSerializer;
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
        rawDough = {
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
        };
      });
      it('converts specialInstructions to an empty string', () => {
        const serializedDough = doughSerializer.serializeDough(rawDough);
        serializedDough.data.attributes.specialInstructions.should.equal('');
      });
    });
    describe('when it gets a dough with specialInstructions = \'\'', () => {
      beforeEach(() => {
        rawDough = {
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
          specialInstructions: '',
        };
      });
      it('leaves specialInstructions as an empty string', () => {
        const serializedDough = doughSerializer.serializeDough(rawDough);
        serializedDough.data.attributes.specialInstructions.should.equal('');
      });
    });
    describe('when it gets a raw dough with a valid format', () => {
      beforeEach(() => {
        rawDough = {
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
          specialInstructions: '',
        };
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
          {
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
            specialInstructions: '',
          },
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
  });
});
