import chai from 'chai';

import { GetFilterProcessor } from 'utils/process-get-filters';

import { processGetFiltersData } from './test-data';

chai.should();

describe('normalizeFilterNames', () => {
  const {
    fooFilter, normalizedFooFilter,
    nameFilter, normalizedNameFilter,
  } = processGetFiltersData;
  describe('when it gets an empty object', () => {
    it('returns an empty object', () => {
      const normalizedFilters = GetFilterProcessor.normalizeFilterNames({});
      normalizedFilters.should.deep.equal({});
    });
  });
  describe('when it gets a non empty object', () => {
    it('changes filter keys but leaves non-filter keys unchanged', () => {
      const normalizedFilters = GetFilterProcessor.normalizeFilterNames({
        ...fooFilter,
        ...nameFilter,
      });
      normalizedFilters.should.deep.equal({
        ...normalizedFooFilter,
        ...normalizedNameFilter,
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

describe('processGetFilters', () => {
  let processor;
  const {
    fooParamName,
    nameParamName,
    fooColumnName,
    nameColumnName,
    fooFilter,
    fooBindParams,
    fooConditional,
    nameFilter,
    nameBindParams,
    nameConditional,
    bahFilter,
    emptyBindParams,
    emptyConditional,
  } = processGetFiltersData;
  beforeEach(() => {
    processor = new GetFilterProcessor(
      [
        fooParamName, nameParamName,
      ],
      {
        ...fooColumnName,
        ...nameColumnName,
      },
    );
  });
  describe('when it gets a valid filter', () => {
    it('returns valid bind params and conditionals', () => {
      const { bindParams, conditionals } = processor.processGetFilters(fooFilter);
      bindParams.should.deep.equal(fooBindParams);
      conditionals.should.equal(fooConditional);
    });
  });
  describe('when it gets an invalid filter', () => {
    it('generates no bind params and no conditionals', () => {
      const { bindParams, conditionals } = processor.processGetFilters(bahFilter);
      bindParams.should.deep.equal(emptyBindParams);
      conditionals.should.equal(emptyConditional);
    });
  });
  describe('when it gets valid and invalid filters', () => {
    it('generates bind params and conditionals only from the valid filter', () => {
      const { bindParams, conditionals } = processor.processGetFilters({
        ...fooFilter,
        ...bahFilter,
      });
      bindParams.should.deep.equal(fooBindParams);
      conditionals.should.equal(fooConditional);
    });
  });
  describe('when it gets filters that do not user the `filter[...]` syntax', () => {
    it('generates valid bind params and conditionals', () => {
      const { bindParams, conditionals } = processor.processGetFilters(nameFilter);
      bindParams.should.deep.equal(nameBindParams);
      conditionals.should.equal(nameConditional);
    });
  });
  describe('when it gets multiple valid filters', () => {
    it('generates valid bind params and conditionals', () => {
      const { bindParams, conditionals } = processor.processGetFilters({
        ...fooFilter,
        ...nameFilter,
      });
      bindParams.should.deep.equal({
        ...fooBindParams,
        ...nameBindParams,
      });
      conditionals.should.equal(`${fooConditional} AND ${nameConditional}`);
    });
  });
});
