import chai from 'chai';

import { GetFilterProcessor } from 'utils/process-get-filters';

chai.should();

describe('normalizeFilterNames', () => {
  describe('when it gets an empty object', () => {
    it('returns an empty object', () => {
      const normalizedFilters = GetFilterProcessor.normalizeFilterNames({});
      normalizedFilters.should.deep.equal({});
    });
  });
  describe('when it gets a non empty object', () => {
    it('changes filter keys but leaves non-filter keys unchanged', () => {
      const normalizedFilters = GetFilterProcessor.normalizeFilterNames({
        notFilter: 'foo',
        'filter[foo]': 'bar',
      });
      normalizedFilters.should.deep.equal({
        notFilter: 'foo',
        foo: 'bar',
      });
    });
  });
});

describe('normalizeFilterName', () => {
  describe('when it gets a filter string', () => {
    it('returns only the text inside the brackets', () => {
      const normalizedFilter = GetFilterProcessor.normalizeFilterName('filter[foo]');
      normalizedFilter.should.equal('foo');
    });
    describe('when the normalized name is `filter`', () => {
      it('still returns only the name inside the brackets', () => {
        const normalizedFilter = GetFilterProcessor.normalizeFilterName('filter[filter]');
        normalizedFilter.should.equal('filter');
      });
    });
  });
  describe('when it gets a non filter string', () => {
    it('returns the string verbatim', () => {
      const normalizedFilter = GetFilterProcessor.normalizeFilterName('foo');
      normalizedFilter.should.equal('foo');
    });
    describe('when the string is `filter`', () => {
      it('still returns the name verbatim', () => {
        const normalizedFilter = GetFilterProcessor.normalizeFilterName('filter');
        normalizedFilter.should.equal('filter');
      });
    });
  });
});

/*
describe('processGetFilters', () => {
  // let processor;
  beforeEach(() => {
    const processor = new GetFilterProcessor(
      [], {},
    );
  });
});
*/
