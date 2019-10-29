const getDoughsConditions = 'ID AS "id", NAME AS "name",'
  + ' GRAMS_FLOUR AS "gramsFlour", GRAMS_WATER AS "gramsWater",'
  + ' FLOUR_TYPE AS "flourType", WATER_TEMP AS "waterTemp",'
  + ' GRAMS_YEAST AS "gramsYeast", GRAMS_SALT AS "gramsSalt",'
  + ' GRAMS_SUGAR AS "gramsSugar", GRAMS_OLIVE_OIL AS "gramsOliveOil",'
  + ' BULK_FERMENT_TIME AS "bulkFermentTime", PROOF_TIME AS "proofTime",'
  + ' SPECIAL_INSTRUCTIONS AS "specialInstructions"';

const waterTempCondition = 'WATER_TEMP = :waterTemp';
const multipleConditions = 'NAME = :name AND GRAMS_WATER = :gramsWater'
  + ' AND PROOF_TIME = :proofTime'
  + ' AND WATER_TEMP = :waterTemp';

const getDoughsData = {
  getDoughsQuery: `SELECT ${getDoughsConditions} FROM DOUGHS `,
  getDoughsQueryWithWaterTemp: `SELECT ${getDoughsConditions} FROM DOUGHS WHERE ${waterTempCondition}`,
  getDoughsQueryWithMultipleConditions: `SELECT ${getDoughsConditions} FROM DOUGHS WHERE ${multipleConditions}`,
  invalidFilters: { abc: 'def' },
  emptyBindParams: {},
  waterTempFilter: { 'filter[waterTemp]': 90 },
  waterTempBindParams: { waterTemp: 90 },
  mixedValidFilters: { 'filter[waterTemp]': 90, abc: 'def' },
  multipleFilters: {
    'filter[waterTemp]': 90,
    'filter[gramsWater]': 200,
    'filter[proofTime]': 90,
    'filter[name]': 'Sample dough',
  },
  multipleFiltersBindParams: {
    waterTemp: 90,
    gramsWater: 200,
    proofTime: 90,
    name: 'Sample dough',
  },
  executeReturnRows: ['a', 'b', 'c'],
  executeReturn: { rows: ['a', 'b', 'c'], metadata: 'ignore-this' },
  baseDoughsGetReturn: { data: [] },
};

export {
  getDoughsData,
};
