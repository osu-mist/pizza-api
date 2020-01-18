import dedent from 'dedent';

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

const doughsColumns = '(NAME, GRAMS_FLOUR, FLOUR_TYPE, GRAMS_WATER, WATER_TEMP, GRAMS_YEAST, GRAMS_SALT, GRAMS_SUGAR, GRAMS_OLIVE_OIL, BULK_FERMENT_TIME, PROOF_TIME, SPECIAL_INSTRUCTIONS)';
const doughsValues = '(:name, :gramsFlour, :flourType, :gramsWater, :waterTemp, :gramsYeast, :gramsSalt, :gramsSugar, :gramsOliveOil, :bulkFermentTime, :proofTime, :specialInstructions)';
const doughsOutColumns = 'ID, NAME, GRAMS_FLOUR, FLOUR_TYPE, GRAMS_WATER, WATER_TEMP, GRAMS_YEAST, GRAMS_SALT, GRAMS_SUGAR, GRAMS_OLIVE_OIL, BULK_FERMENT_TIME, PROOF_TIME, SPECIAL_INSTRUCTIONS';
const doughsOutBindParams = ':idOut, :nameOut, :gramsFlourOut, :flourTypeOut, :gramsWaterOut, :waterTempOut, :gramsYeastOut, :gramsSaltOut, :gramsSugarOut, :gramsOliveOilOut, :bulkFermentTimeOut, :proofTimeOut, :specialInstructionsOut';
const doughsQuery = `INSERT INTO DOUGHS ${doughsColumns} VALUES ${doughsValues}
   RETURNING ${doughsOutColumns} INTO ${doughsOutBindParams}`;

const postDoughsData = {
  doughsPostQuery: doughsQuery,
  testDbReturn: {
    outBinds: {
      idOut: ['201'],
      nameOut: ['weeknight pizza dough'],
      gramsFlourOut: ['500'],
      flourTypeOut: ['All Purpose'],
      gramsWaterOut: ['400'],
      waterTempOut: ['90'],
      gramsYeastOut: ['5'],
      gramsSaltOut: ['15'],
      gramsSugarOut: ['0'],
      gramsOliveOilOut: ['0'],
      bulkFermentTimeOut: ['60'],
      proofTimeOut: ['15'],
      specialInstructionsOut: [null],
    },
  },
  sampleValidDoughData: {
    data: {
      type: 'dough',
      attributes: {
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

  doughsBindParams: {
    idOut: { type: 2001, dir: 3003 },
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
  normalizedDough: {
    name: 'weeknight pizza dough',
    id: '201',
    gramsFlour: '500',
    flourType: 'All Purpose',
    gramsWater: '400',
    waterTemp: '90',
    gramsYeast: '5',
    gramsSalt: '15',
    bulkFermentTime: '60',
    proofTime: '15',
    gramsSugar: '0',
    gramsOliveOil: '0',
    specialInstructions: null,
  },

  invalidDoughsData: {
    data: {
      type: 'dough',
      attributes: {
        foo: 'bar',
      },
    },
  },
};

const getDoughByIdData = {
  getDoughByIdQuery: `SELECT ${getDoughsConditions} FROM DOUGHS WHERE ID = :id`,
  emptyDatabaseReturn: { rows: [] },
  singleRecordDatabaseReturn: { rows: ['a'] },
  singleRecord: 'a',
};

const updateDoughsByIdData = {
  updateDoughNameQuery: `UPDATE DOUGHS
  SET NAME = :name
  WHERE ID = :id
  RETURNING ID, NAME, GRAMS_FLOUR, FLOUR_TYPE, GRAMS_WATER, WATER_TEMP, GRAMS_YEAST, GRAMS_SALT, GRAMS_SUGAR, GRAMS_OLIVE_OIL, BULK_FERMENT_TIME, PROOF_TIME, SPECIAL_INSTRUCTIONS INTO :idOut, :nameOut, :gramsFlourOut, :flourTypeOut, :gramsWaterOut, :waterTempOut, :gramsYeastOut, :gramsSaltOut, :gramsSugarOut, :gramsOliveOilOut, :bulkFermentTimeOut, :proofTimeOut, :specialInstructionsOut`,
  doughsOutBinds: {
    bulkFermentTimeOut: { dir: 3003, type: 2002 },
    flourTypeOut: { dir: 3003, type: 2001 },
    gramsFlourOut: { dir: 3003, type: 2002 },
    gramsOliveOilOut: { dir: 3003, type: 2002 },
    gramsSaltOut: { dir: 3003, type: 2002 },
    gramsSugarOut: { dir: 3003, type: 2002 },
    gramsWaterOut: { dir: 3003, type: 2002 },
    gramsYeastOut: { dir: 3003, type: 2002 },
    idOut: { dir: 3003, type: 2001 },
    nameOut: { dir: 3003, type: 2001 },
    proofTimeOut: { dir: 3003, type: 2002 },
    specialInstructionsOut: { dir: 3003, type: 2001 },
    waterTempOut: { dir: 3003, type: 2002 },
  },
  doughPatchBodyWithInvalidAttribute: {
    data: {
      type: 'dough',
      id: '201',
      attributes: {
        foo: 'bar',
      },
    },
  },
  doughsPatchBodyWithEmptyAttributes: {
    data: {
      type: 'dough',
      id: '201',
      attributes: {},
    },
  },
  doughPatchBodyWithName: {
    data: {
      type: 'dough',
      id: '201',
      attributes: {
        name: 'test',
      },
    },
  },
  dbReturnWithDifferentId: {
    outBinds: {
      idOut: ['2'],
      nameOut: ['weeknight pizza dough'],
      gramsFlourOut: ['500'],
      flourTypeOut: ['All Purpose'],
      gramsWaterOut: ['400'],
      waterTempOut: ['90'],
      gramsYeastOut: ['5'],
      gramsSaltOut: ['15'],
      gramsSugarOut: ['0'],
      gramsOliveOilOut: ['0'],
      bulkFermentTimeOut: ['60'],
      proofTimeOut: ['15'],
      specialInstructionsOut: [null],
    },
  },
  noRowsAffectedDatabaseReturn: {
    rowsAffected: 0,
    outBinds: {
      idOut: [],
      nameOut: [],
      gramsFlourOut: [],
      flourTypeOut: [],
      gramsWaterOut: [],
      waterTempOut: [],
      gramsYeastOut: [],
      gramsSaltOut: [],
      gramsSugarOut: [],
      gramsOliveOilOut: [],
      bulkFermentTimeOut: [],
      proofTimeOut: [],
      specialInstructionsOut: [],
    },
  },
};

const processGetFiltersData = {
  fooParamName: { name: 'filter[foo]' },
  nameParamName: { name: 'name' },
  fooColumnName: { foo: 'FOO' },
  nameColumnName: { name: 'NAME' },
  fooAndNameColumnNames: {
    foo: 'FOO',
    name: 'NAME',
  },
  fooFilter: {
    'filter[foo]': 'baz',
  },
  normalizedFooFilter: {
    foo: 'baz',
  },
  normalizedNameFilter: {
    name: 'shrek',
  },
  fooBindParams: {
    foo: 'baz',
  },
  fooConditional: 'FOO = :foo',
  bahFilter: {
    bah: 'humbug',
  },
  emptyBindParams: {},
  emptyConditional: '',
  nameFilter: {
    name: 'shrek',
  },
  nameBindParams: {
    name: 'shrek',
  },
  nameConditional: 'NAME = :name',
  fooBahFilters: {
    bah: 'humbug',
    'filter[foo]': 'baz',
  },
  fooNameFilters: {
    name: 'shrek',
    'filter[foo]': 'baz',
  },
};

const getIngredientsTestConditionals = 'TEST = :test';
const getIngredientsQueryAliases = 'ID AS "id", TYPE AS "ingredientType", NAME AS "name", NOTES AS "notes"';
const getIngredientsQuery = `SELECT ${getIngredientsQueryAliases} FROM INGREDIENTS WHERE ${getIngredientsTestConditionals}`;
const emptyGetIngredientsQuery = `SELECT ${getIngredientsQueryAliases} FROM INGREDIENTS `;
const getIngredientsData = {
  getIngredientsQuery,
  emptyGetIngredientsQuery,
  testFilters: {
    'filter[name]': 'cheddar',
    invalidFilter: 'foo',
  },
  ingredientAliases: {
    id: 'ID',
    ingredientType: 'TYPE',
    name: 'NAME',
    notes: 'NOTES',
  },
  testBindParams: { test: true },
  testConditionals: 'TEST = :test',
  testSerializerReturn: { test: true },
  testConnectionReturn: { rows: ['a', 'b', 'c'] },
  testConnectionReturnRows: ['a', 'b', 'c'],
};

const ingredientColumns = 'NAME, TYPE, NOTES';
const ingredientValues = ':name, :ingredientType, :notes';
const ingredientsOutBindParamColumnNames = 'ID, NAME, TYPE, NOTES';
const ingredientsOutBindParamValues = ':idOut, :nameOut, :ingredientTypeOut, :notesOut';
const postIngredientsQuery = `INSERT INTO INGREDIENTS (${ingredientColumns}) VALUES (${ingredientValues})
  RETURNING ${ingredientsOutBindParamColumnNames} INTO ${ingredientsOutBindParamValues}`;
const postIngredientData = {
  testDbReturn: {
    outBinds: {
      idOut: ['100'],
      nameOut: ['sausage'],
      ingredientTypeOut: ['meat'],
      notesOut: ['no notes'],
    },
  },
  sampleValidIngredientData: {
    data: {
      type: 'ingredient',
      id: '100',
      attributes: {
        name: 'sausage',
        ingredientType: 'meat',
        notes: 'no notes',
      },
    },
  },
  ingredientsPostQuery: postIngredientsQuery,
  ingredientsBindParams: {
    name: 'sausage',
    ingredientType: 'meat',
    notes: 'no notes',
    idOut: { type: 2001, dir: 3003 },
    nameOut: { type: 2001, dir: 3003 },
    ingredientTypeOut: { type: 2001, dir: 3003 },
    notesOut: { type: 2001, dir: 3003 },
  },
  normalizedIngredient: {
    id: '100',
    name: 'sausage',
    ingredientType: 'meat',
    notes: 'no notes',
  },
  invalidIngredientsData: {
    data: {
      type: 'ingredient',
      attributes: {
        foo: 'bar',
      },
    },
  },
};

const getIngredientByIdData = {
  singleRecordReturn: {
    rows: ['a'],
  },
  singleRecord: 'a',
  emptyRecordReturn: { rows: [] },
  getIngredientByIdQuery: 'SELECT ID AS "id", TYPE AS "ingredientType", NAME AS "name", NOTES AS "notes" FROM INGREDIENTS WHERE ID = :id',
};

const updateIngredientByIdData = {
  updateIngredientQuery: `UPDATE INGREDIENTS
  SET NAME = :name, TYPE = :ingredientType, NOTES = :notes
  WHERE ID = :id
  RETURNING ID, NAME, TYPE, NOTES INTO :idOut, :nameOut, :ingredientTypeOut, :notesOut`,
  updateIngredientsBindParams: {
    id: '100',
    name: 'sausage',
    ingredientType: 'meat',
    notes: 'no notes',
    idOut: { type: 2001, dir: 3003 },
    nameOut: { type: 2001, dir: 3003 },
    ingredientTypeOut: { type: 2001, dir: 3003 },
    notesOut: { type: 2001, dir: 3003 },
  },
  emptyUpdateRecordReturn: {
    rowsAffected: 0,
    outBinds: {
      idOut: [],
      nameOut: [],
      ingredientTypeOut: [],
      notesOut: [],
    },
  },
  differentIdDbReturn: {
    outBinds: {
      idOut: ['200'],
      nameOut: ['sausage'],
      ingredientTypeOut: ['meat'],
      notesOut: ['no notes'],
    },
  },
  sampleInvalidIngredientData: {
    data: {
      type: 'ingredient',
      id: '100',
      attributes: {
        foo: 'bar',
      },
    },
  },
  sampleEmptyAttributesData: {
    data: {
      type: 'ingredient',
      id: '100',
      attributes: {},
    },
  },

};
const doughSerializerData = {
  nullSpecialInstructionsDough: {
    name: 'weeknight pizza dough',
    id: '201',
    gramsFlour: '500',
    flourType: 'All Purpose',
    gramsWater: '400',
    waterTemp: '90',
    gramsYeast: '5',
    gramsSalt: '15',
    bulkFermentTime: '60',
    proofTime: '15',
    gramsSugar: '0',
    gramsOliveOil: '0',
    specialInstructions: null,
  },
  emptyStringSpecialInstructionsDough: {
    name: 'weeknight pizza dough',
    id: '201',
    gramsFlour: '500',
    flourType: 'All Purpose',
    gramsWater: '400',
    waterTemp: '90',
    gramsYeast: '5',
    gramsSalt: '15',
    bulkFermentTime: '60',
    proofTime: '15',
    gramsSugar: '0',
    gramsOliveOil: '0',
    specialInstructions: '',
  },
};

const ingredientSerializerData = {
  nullNotesIngredient: {
    id: '201',
    ingredientType: 'cheese',
    name: 'mozzarella',
    notes: null,
  },
  emptyStringNotesIngredient: {
    id: '201',
    ingredientType: 'cheese',
    name: 'mozzarella',
    notes: '',
  },
};

const serializePizzaData = {
  baseInputPizza: {
    id: '1',
    name: 'sample pizza',
    ovenTemp: '500',
    bakeTime: '10',
    specialInstructions: null,
    ingredients: [
      {
        id: '1',
        name: 'sausage',
        ingredientType: 'meat',
        notes: null,
      },
    ],
    dough: {
      name: 'weeknight pizza dough',
      id: '201',
      gramsFlour: '500',
      flourType: 'All Purpose',
      gramsWater: '400',
      waterTemp: '90',
      gramsYeast: '5',
      gramsSalt: '15',
      bulkFermentTime: '60',
      proofTime: '15',
      gramsSugar: '0',
      gramsOliveOil: '0',
      specialInstructions: null,
    },
  },
  goalSerializedPizza: {
    data: {
      attributes: {
        name: 'sample pizza',
        ovenTemp: 500,
        bakeTime: 10,
        specialInstructions: '',
      },
      id: '1',
      type: 'string',
      relationships: {
        ingredients: {
          data: [
            {
              type: 'ingredient',
              id: '1',
            },
          ],
          links: {
            related: '/v1/pizzas/1/ingredients',
            self: '/v1/pizzas/1/relationships/ingredients',
          },
        },
        dough: {
          data: {
            type: 'dough',
            id: '201',
          },
          links: {
            related: '/v1/pizzas/1/dough',
            self: '/v1/pizzas/1/relationships/dough',
          },
        },
      },
    },
    links: {
      self: '/v1/pizzas/1',
    },
    included: [
      {
        type: 'dough',
        id: '201',
        attributes: {
          name: 'weeknight pizza dough',
          gramsFlour: 500,
          flourType: 'All Purpose',
          gramsWater: 400,
          waterTemp: 90,
          gramsYeast: 5,
          gramsSalt: 15,
          gramsSugar: 0,
          gramsOliveOil: 0,
          bulkFermentTime: 60,
          proofTime: 15,
          specialInstructions: '',
        },
        links: {
          self: '/v1/dough/201',
        },
      },
      {
        type: 'ingredient',
        id: '1',
        attributes: {
          name: 'sausage',
          ingredientType: 'meat',
          notes: '',
        },
        links: {
          self: '/v1/ingredients/1',
        },
      },

    ],
  },
};

const getPizzaByIdData = {
  getPizzaIngredientsAndDoughQuery: dedent`SELECT PIZZAS.ID AS "PIZZA_id",
      PIZZAS.DOUGH_ID AS "PIZZA_doughId",
      PIZZAS.NAME AS "PIZZA_name",
      PIZZAS.BAKE_TIME AS "PIZZA_bakeTime",
      PIZZAS.OVEN_TEMP AS "PIZZA_ovenTemp",
      PIZZAS.SPECIAL_INSTRUCTIONS AS "PIZZA_specialInstructions",
      DOUGHS.ID AS "DOUGH_id",
      DOUGHS.NAME AS "DOUGH_name",
      DOUGHS.GRAMS_FLOUR AS "DOUGH_gramsFlour",
      DOUGHS.GRAMS_WATER AS "DOUGH_gramsWater",
      DOUGHS.FLOUR_TYPE AS "DOUGH_flourType",
      DOUGHS.WATER_TEMP AS "DOUGH_waterTemp",
      DOUGHS.GRAMS_YEAST AS "DOUGH_gramsYeast",
      DOUGHS.GRAMS_SALT AS "DOUGH_gramsSalt",
      DOUGHS.GRAMS_SUGAR AS "DOUGH_gramsSugar",
      DOUGHS.GRAMS_OLIVE_OIL AS "DOUGH_gramsOliveOil",
      DOUGHS.BULK_FERMENT_TIME AS "DOUGH_bulkFermentTime",
      DOUGHS.PROOF_TIME AS "DOUGH_proofTime",
      DOUGHS.SPECIAL_INSTRUCTIONS AS "DOUGH_specialInstructions",
      INGREDIENTS.ID AS "INGREDIENT_id",
      INGREDIENTS.TYPE AS "INGREDIENT_ingredientType",
      INGREDIENTS.NAME AS "INGREDIENT_name",
      INGREDIENTS.NOTES AS "INGREDIENT_notes"
    FROM PIZZAS
    LEFT JOIN DOUGHS ON PIZZAS.DOUGH_ID = DOUGHS.ID
    LEFT JOIN PIZZA_INGREDIENTS ON PIZZAS.ID = PIZZA_INGREDIENTS.PIZZA_ID
    LEFT JOIN INGREDIENTS ON INGREDIENTS.ID = PIZZA_INGREDIENTS.INGREDIENT_ID
    WHERE PIZZAS.ID = :id`,
  getPizzaIngredientsQuery: dedent`SELECT PIZZAS.ID AS "PIZZA_id",
      PIZZAS.DOUGH_ID AS "PIZZA_doughId",
      PIZZAS.NAME AS "PIZZA_name",
      PIZZAS.BAKE_TIME AS "PIZZA_bakeTime",
      PIZZAS.OVEN_TEMP AS "PIZZA_ovenTemp",
      PIZZAS.SPECIAL_INSTRUCTIONS AS "PIZZA_specialInstructions",
      INGREDIENTS.ID AS "INGREDIENT_id",
      INGREDIENTS.TYPE AS "INGREDIENT_ingredientType",
      INGREDIENTS.NAME AS "INGREDIENT_name",
      INGREDIENTS.NOTES AS "INGREDIENT_notes"
    FROM PIZZAS

    LEFT JOIN PIZZA_INGREDIENTS ON PIZZAS.ID = PIZZA_INGREDIENTS.PIZZA_ID
    LEFT JOIN INGREDIENTS ON INGREDIENTS.ID = PIZZA_INGREDIENTS.INGREDIENT_ID
    WHERE PIZZAS.ID = :id`,
  getPizzaDoughQuery: dedent`SELECT PIZZAS.ID AS "PIZZA_id",
      PIZZAS.DOUGH_ID AS "PIZZA_doughId",
      PIZZAS.NAME AS "PIZZA_name",
      PIZZAS.BAKE_TIME AS "PIZZA_bakeTime",
      PIZZAS.OVEN_TEMP AS "PIZZA_ovenTemp",
      PIZZAS.SPECIAL_INSTRUCTIONS AS "PIZZA_specialInstructions",
      DOUGHS.ID AS "DOUGH_id",
      DOUGHS.NAME AS "DOUGH_name",
      DOUGHS.GRAMS_FLOUR AS "DOUGH_gramsFlour",
      DOUGHS.GRAMS_WATER AS "DOUGH_gramsWater",
      DOUGHS.FLOUR_TYPE AS "DOUGH_flourType",
      DOUGHS.WATER_TEMP AS "DOUGH_waterTemp",
      DOUGHS.GRAMS_YEAST AS "DOUGH_gramsYeast",
      DOUGHS.GRAMS_SALT AS "DOUGH_gramsSalt",
      DOUGHS.GRAMS_SUGAR AS "DOUGH_gramsSugar",
      DOUGHS.GRAMS_OLIVE_OIL AS "DOUGH_gramsOliveOil",
      DOUGHS.BULK_FERMENT_TIME AS "DOUGH_bulkFermentTime",
      DOUGHS.PROOF_TIME AS "DOUGH_proofTime",
      DOUGHS.SPECIAL_INSTRUCTIONS AS "DOUGH_specialInstructions"
    FROM PIZZAS
    LEFT JOIN DOUGHS ON PIZZAS.DOUGH_ID = DOUGHS.ID

    WHERE PIZZAS.ID = :id`,
  getPizzaQuery: dedent`SELECT PIZZAS.ID AS "PIZZA_id",
      PIZZAS.DOUGH_ID AS "PIZZA_doughId",
      PIZZAS.NAME AS "PIZZA_name",
      PIZZAS.BAKE_TIME AS "PIZZA_bakeTime",
      PIZZAS.OVEN_TEMP AS "PIZZA_ovenTemp",
      PIZZAS.SPECIAL_INSTRUCTIONS AS "PIZZA_specialInstructions"
    FROM PIZZAS


    WHERE PIZZAS.ID = :id`,
  fullRawPizza: {
    id: '1',
    bakeTime: '10',
    doughId: '201',
    name: 'sample pizza',
    ovenTemp: '500',
    specialInstructions: null,
    dough: {
      bulkFermentTime: '60',
      flourType: 'All Purpose',
      gramsFlour: '500',
      gramsOliveOil: '0',
      gramsSalt: '15',
      gramsSugar: '0',
      gramsWater: '400',
      gramsYeast: '5',
      id: '201',
      name: 'weeknight pizza dough',
      proofTime: '15',
      specialInstructions: null,
      waterTemp: '90',
    },
    ingredients: [{
      id: '1', name: 'sausage', notes: null, ingredientType: 'meat',
    }],
  },
  pizzaDbReturn: {
    rows: [
      {
        id: '1',
        name: 'sample pizza',
        ovenTemp: '500',
        bakeTime: '10',
        specialInstructions: null,
      },
    ],
  },
  emptyDbReturn: {
    rows: [],
  },
  pizzaIngredientsDbReturn: {
    rows: [
      {
        id: '1',
        name: 'sausage',
        type: 'meat',
        notes: null,
      },
    ],
  },
  multipleRowsReturn: {
    rows: [
      {
        id: '1',
        name: 'sausage',
        type: 'meat',
        notes: null,
      }, {
        id: '1',
        name: 'sausage',
        type: 'meat',
        notes: null,
      }, {
        id: '1',
        name: 'sausage',
        type: 'meat',
        notes: null,
      },
    ],
  },
  serializedDoughReturn: {
    data: {
      id: '1',
      attributes: {
        name: 'weeknight pizza dough',
        id: '201',
        gramsFlour: '500',
        flourType: 'All Purpose',
        gramsWater: '400',
        waterTemp: '90',
        gramsYeast: '5',
        gramsSalt: '15',
        bulkFermentTime: '60',
        proofTime: '15',
        gramsSugar: '0',
        gramsOliveOil: '0',
        specialInstructions: null,
      },
    },
  },
  baseSerializerReturn: { data: [] },
  fullRawPizzaReturn: {
    rows: [{
      PIZZA_id: '1',
      PIZZA_doughId: '201',
      PIZZA_name: 'sample pizza',
      PIZZA_bakeTime: '10',
      PIZZA_ovenTemp: '500',
      PIZZA_specialInstructions: null,
      DOUGH_id: '201',
      DOUGH_name: 'weeknight pizza dough',
      DOUGH_gramsFlour: '500',
      DOUGH_gramsWater: '400',
      DOUGH_flourType: 'All Purpose',
      DOUGH_waterTemp: '90',
      DOUGH_gramsYeast: '5',
      DOUGH_gramsSalt: '15',
      DOUGH_gramsSugar: '0',
      DOUGH_gramsOliveOil: '0',
      DOUGH_bulkFermentTime: '60',
      DOUGH_proofTime: '15',
      DOUGH_specialInstructions: null,
      INGREDIENT_id: '1',
      INGREDIENT_ingredientType: 'meat',
      INGREDIENT_name: 'sausage',
      INGREDIENT_notes: null,
    }],
  },
  rawPizzaReturnNullDough: {
    rows: [{
      PIZZA_id: '1',
      PIZZA_doughId: '201',
      PIZZA_name: 'sample pizza',
      PIZZA_bakeTime: '10',
      PIZZA_ovenTemp: '500',
      PIZZA_specialInstructions: null,
      DOUGH_id: null,
      DOUGH_name: null,
      DOUGH_gramsFlour: null,
      DOUGH_gramsWater: null,
      DOUGH_flourType: null,
      DOUGH_waterTemp: null,
      DOUGH_gramsYeast: null,
      DOUGH_gramsSalt: null,
      DOUGH_gramsSugar: null,
      DOUGH_gramsOliveOil: null,
      DOUGH_bulkFermentTime: null,
      DOUGH_proofTime: null,
      DOUGH_specialInstructions: null,
      INGREDIENT_id: '1',
      INGREDIENT_ingredientType: 'meat',
      INGREDIENT_name: 'sausage',
      INGREDIENT_notes: null,
    }],
  },
  rawPizzaReturnNullIngredients: {
    rows: [{
      PIZZA_id: '1',
      PIZZA_doughId: '201',
      PIZZA_name: 'sample pizza',
      PIZZA_bakeTime: '10',
      PIZZA_ovenTemp: '500',
      PIZZA_specialInstructions: null,
      DOUGH_id: '201',
      DOUGH_name: 'weeknight pizza dough',
      DOUGH_gramsFlour: '500',
      DOUGH_gramsWater: '400',
      DOUGH_flourType: 'All Purpose',
      DOUGH_waterTemp: '90',
      DOUGH_gramsYeast: '5',
      DOUGH_gramsSalt: '15',
      DOUGH_gramsSugar: '0',
      DOUGH_gramsOliveOil: '0',
      DOUGH_bulkFermentTime: '60',
      DOUGH_proofTime: '15',
      DOUGH_specialInstructions: null,
      INGREDIENT_id: null,
      INGREDIENT_ingredientType: null,
      INGREDIENT_name: null,
      INGREDIENT_notes: null,
    }],
  },
  rawPizzaReturnWithoutDough: {
    rows: [{
      PIZZA_id: '1',
      PIZZA_doughId: '201',
      PIZZA_name: 'sample pizza',
      PIZZA_bakeTime: '10',
      PIZZA_ovenTemp: '500',
      PIZZA_specialInstructions: null,
      INGREDIENT_id: '1',
      INGREDIENT_ingredientType: 'meat',
      INGREDIENT_name: 'sausage',
      INGREDIENT_notes: null,
    }],
  },
  rawPizzaReturnWithoutIngredientsOrDough: {
    rows: [{
      PIZZA_id: '1',
      PIZZA_doughId: '201',
      PIZZA_name: 'sample pizza',
      PIZZA_bakeTime: '10',
      PIZZA_ovenTemp: '500',
      PIZZA_specialInstructions: null,
    }],
  },
  rawPizzaReturnWithoutIngredients: {
    rows: [{
      PIZZA_id: '1',
      PIZZA_doughId: '201',
      PIZZA_name: 'sample pizza',
      PIZZA_bakeTime: '10',
      PIZZA_ovenTemp: '500',
      PIZZA_specialInstructions: null,
      DOUGH_id: '201',
      DOUGH_name: 'weeknight pizza dough',
      DOUGH_gramsFlour: '500',
      DOUGH_gramsWater: '400',
      DOUGH_flourType: 'All Purpose',
      DOUGH_waterTemp: '90',
      DOUGH_gramsYeast: '5',
      DOUGH_gramsSalt: '15',
      DOUGH_gramsSugar: '0',
      DOUGH_gramsOliveOil: '0',
      DOUGH_bulkFermentTime: '60',
      DOUGH_proofTime: '15',
      DOUGH_specialInstructions: null,
    }],
  },
};

const getPizzasData = {
  getPizzasQuery: dedent`SELECT PIZZAS.ID AS "PIZZA_id",
    PIZZAS.DOUGH_ID AS "PIZZA_doughId",
    PIZZAS.NAME AS "PIZZA_name",
    PIZZAS.BAKE_TIME AS "PIZZA_bakeTime",
    PIZZAS.OVEN_TEMP AS "PIZZA_ovenTemp",
    PIZZAS.SPECIAL_INSTRUCTIONS AS "PIZZA_specialInstructions"
  FROM PIZZAS`,
  getPizzasQueryNameFilter: dedent`SELECT PIZZAS.ID AS "PIZZA_id",
    PIZZAS.DOUGH_ID AS "PIZZA_doughId",
    PIZZAS.NAME AS "PIZZA_name",
    PIZZAS.BAKE_TIME AS "PIZZA_bakeTime",
    PIZZAS.OVEN_TEMP AS "PIZZA_ovenTemp",
    PIZZAS.SPECIAL_INSTRUCTIONS AS "PIZZA_specialInstructions"
  FROM PIZZAS


  WHERE PIZZAS.NAME = :name`,
  fullRawPizzasReturn: {
    rows: [{
      PIZZA_id: '1',
      PIZZA_doughId: '201',
      PIZZA_name: 'sample pizza',
      PIZZA_bakeTime: '10',
      PIZZA_ovenTemp: '500',
      PIZZA_specialInstructions: null,
      DOUGH_id: '201',
      DOUGH_name: 'weeknight pizza dough',
      DOUGH_gramsFlour: '500',
      DOUGH_gramsWater: '400',
      DOUGH_flourType: 'All Purpose',
      DOUGH_waterTemp: '90',
      DOUGH_gramsYeast: '5',
      DOUGH_gramsSalt: '15',
      DOUGH_gramsSugar: '0',
      DOUGH_gramsOliveOil: '0',
      DOUGH_bulkFermentTime: '60',
      DOUGH_proofTime: '15',
      DOUGH_specialInstructions: null,
      INGREDIENT_id: '1',
      INGREDIENT_ingredientType: 'meat',
      INGREDIENT_name: 'sausage',
      INGREDIENT_notes: null,
    },
    {
      PIZZA_id: '2',
      PIZZA_doughId: '201',
      PIZZA_name: 'sample pizza',
      PIZZA_bakeTime: '10',
      PIZZA_ovenTemp: '500',
      PIZZA_specialInstructions: null,
      DOUGH_id: '201',
      DOUGH_name: 'weeknight pizza dough',
      DOUGH_gramsFlour: '500',
      DOUGH_gramsWater: '400',
      DOUGH_flourType: 'All Purpose',
      DOUGH_waterTemp: '90',
      DOUGH_gramsYeast: '5',
      DOUGH_gramsSalt: '15',
      DOUGH_gramsSugar: '0',
      DOUGH_gramsOliveOil: '0',
      DOUGH_bulkFermentTime: '60',
      DOUGH_proofTime: '15',
      DOUGH_specialInstructions: null,
      INGREDIENT_id: '1',
      INGREDIENT_ingredientType: 'meat',
      INGREDIENT_name: 'sausage',
      INGREDIENT_notes: null,
    }],
  },
  rawPizzaOnlyDoughReturn: {
    rows: [{
      PIZZA_id: '1',
      PIZZA_doughId: '201',
      PIZZA_name: 'sample pizza',
      PIZZA_bakeTime: '10',
      PIZZA_ovenTemp: '500',
      PIZZA_specialInstructions: null,
      DOUGH_id: '201',
      DOUGH_name: 'weeknight pizza dough',
      DOUGH_gramsFlour: '500',
      DOUGH_gramsWater: '400',
      DOUGH_flourType: 'All Purpose',
      DOUGH_waterTemp: '90',
      DOUGH_gramsYeast: '5',
      DOUGH_gramsSalt: '15',
      DOUGH_gramsSugar: '0',
      DOUGH_gramsOliveOil: '0',
      DOUGH_bulkFermentTime: '60',
      DOUGH_proofTime: '15',
      DOUGH_specialInstructions: null,
    },
    {
      PIZZA_id: '2',
      PIZZA_doughId: '201',
      PIZZA_name: 'sample pizza',
      PIZZA_bakeTime: '10',
      PIZZA_ovenTemp: '500',
      PIZZA_specialInstructions: null,
      DOUGH_id: '201',
      DOUGH_name: 'weeknight pizza dough',
      DOUGH_gramsFlour: '500',
      DOUGH_gramsWater: '400',
      DOUGH_flourType: 'All Purpose',
      DOUGH_waterTemp: '90',
      DOUGH_gramsYeast: '5',
      DOUGH_gramsSalt: '15',
      DOUGH_gramsSugar: '0',
      DOUGH_gramsOliveOil: '0',
      DOUGH_bulkFermentTime: '60',
      DOUGH_proofTime: '15',
      DOUGH_specialInstructions: null,
    }],
  },
  rawPizzaOnlyIngredientsReturn: {
    rows: [{
      PIZZA_id: '1',
      PIZZA_doughId: '201',
      PIZZA_name: 'sample pizza',
      PIZZA_bakeTime: '10',
      PIZZA_ovenTemp: '500',
      PIZZA_specialInstructions: null,
      INGREDIENT_id: '1',
      INGREDIENT_ingredientType: 'meat',
      INGREDIENT_name: 'sausage',
      INGREDIENT_notes: null,
    },
    {
      PIZZA_id: '2',
      PIZZA_doughId: '201',
      PIZZA_name: 'sample pizza',
      PIZZA_bakeTime: '10',
      PIZZA_ovenTemp: '500',
      PIZZA_specialInstructions: null,
      INGREDIENT_id: '1',
      INGREDIENT_ingredientType: 'meat',
      INGREDIENT_name: 'sausage',
      INGREDIENT_notes: null,
    }],
  },
  rawPizzaNoDoughOrIngredients: {
    rows: [{
      PIZZA_id: '1',
      PIZZA_doughId: '201',
      PIZZA_name: 'sample pizza',
      PIZZA_bakeTime: '10',
      PIZZA_ovenTemp: '500',
      PIZZA_specialInstructions: null,
    },
    {
      PIZZA_id: '2',
      PIZZA_doughId: '201',
      PIZZA_name: 'sample pizza',
      PIZZA_bakeTime: '10',
      PIZZA_ovenTemp: '500',
      PIZZA_specialInstructions: null,
    }],
  },
  secondRawPizza: {
    id: '2',
    bakeTime: '10',
    doughId: '201',
    name: 'sample pizza',
    ovenTemp: '500',
    specialInstructions: null,
    dough: {
      bulkFermentTime: '60',
      flourType: 'All Purpose',
      gramsFlour: '500',
      gramsOliveOil: '0',
      gramsSalt: '15',
      gramsSugar: '0',
      gramsWater: '400',
      gramsYeast: '5',
      id: '201',
      name: 'weeknight pizza dough',
      proofTime: '15',
      specialInstructions: null,
      waterTemp: '90',
    },
    ingredients: [{
      id: '1', name: 'sausage', notes: null, ingredientType: 'meat',
    }],
  },
  getPizzasWithIngredientsAndDoughsQuery: dedent`SELECT PIZZAS.ID AS "PIZZA_id",
      PIZZAS.DOUGH_ID AS "PIZZA_doughId",
      PIZZAS.NAME AS "PIZZA_name",
      PIZZAS.BAKE_TIME AS "PIZZA_bakeTime",
      PIZZAS.OVEN_TEMP AS "PIZZA_ovenTemp",
      PIZZAS.SPECIAL_INSTRUCTIONS AS "PIZZA_specialInstructions",
      DOUGHS.ID AS "DOUGH_id",
      DOUGHS.NAME AS "DOUGH_name",
      DOUGHS.GRAMS_FLOUR AS "DOUGH_gramsFlour",
      DOUGHS.GRAMS_WATER AS "DOUGH_gramsWater",
      DOUGHS.FLOUR_TYPE AS "DOUGH_flourType",
      DOUGHS.WATER_TEMP AS "DOUGH_waterTemp",
      DOUGHS.GRAMS_YEAST AS "DOUGH_gramsYeast",
      DOUGHS.GRAMS_SALT AS "DOUGH_gramsSalt",
      DOUGHS.GRAMS_SUGAR AS "DOUGH_gramsSugar",
      DOUGHS.GRAMS_OLIVE_OIL AS "DOUGH_gramsOliveOil",
      DOUGHS.BULK_FERMENT_TIME AS "DOUGH_bulkFermentTime",
      DOUGHS.PROOF_TIME AS "DOUGH_proofTime",
      DOUGHS.SPECIAL_INSTRUCTIONS AS "DOUGH_specialInstructions",
      INGREDIENTS.ID AS "INGREDIENT_id",
      INGREDIENTS.TYPE AS "INGREDIENT_ingredientType",
      INGREDIENTS.NAME AS "INGREDIENT_name",
      INGREDIENTS.NOTES AS "INGREDIENT_notes"
    FROM PIZZAS
    LEFT JOIN DOUGHS ON PIZZAS.DOUGH_ID = DOUGHS.ID
    LEFT JOIN PIZZA_INGREDIENTS ON PIZZAS.ID = PIZZA_INGREDIENTS.PIZZA_ID
    LEFT JOIN INGREDIENTS ON INGREDIENTS.ID = PIZZA_INGREDIENTS.INGREDIENT_ID`,
  getPizzasWithDoughQuery: dedent`SELECT PIZZAS.ID AS "PIZZA_id",
      PIZZAS.DOUGH_ID AS "PIZZA_doughId",
      PIZZAS.NAME AS "PIZZA_name",
      PIZZAS.BAKE_TIME AS "PIZZA_bakeTime",
      PIZZAS.OVEN_TEMP AS "PIZZA_ovenTemp",
      PIZZAS.SPECIAL_INSTRUCTIONS AS "PIZZA_specialInstructions",
      DOUGHS.ID AS "DOUGH_id",
      DOUGHS.NAME AS "DOUGH_name",
      DOUGHS.GRAMS_FLOUR AS "DOUGH_gramsFlour",
      DOUGHS.GRAMS_WATER AS "DOUGH_gramsWater",
      DOUGHS.FLOUR_TYPE AS "DOUGH_flourType",
      DOUGHS.WATER_TEMP AS "DOUGH_waterTemp",
      DOUGHS.GRAMS_YEAST AS "DOUGH_gramsYeast",
      DOUGHS.GRAMS_SALT AS "DOUGH_gramsSalt",
      DOUGHS.GRAMS_SUGAR AS "DOUGH_gramsSugar",
      DOUGHS.GRAMS_OLIVE_OIL AS "DOUGH_gramsOliveOil",
      DOUGHS.BULK_FERMENT_TIME AS "DOUGH_bulkFermentTime",
      DOUGHS.PROOF_TIME AS "DOUGH_proofTime",
      DOUGHS.SPECIAL_INSTRUCTIONS AS "DOUGH_specialInstructions"
    FROM PIZZAS
    LEFT JOIN DOUGHS ON PIZZAS.DOUGH_ID = DOUGHS.ID`,
  getPizzasWithIngredientsQuery: dedent`SELECT PIZZAS.ID AS "PIZZA_id",
      PIZZAS.DOUGH_ID AS "PIZZA_doughId",
      PIZZAS.NAME AS "PIZZA_name",
      PIZZAS.BAKE_TIME AS "PIZZA_bakeTime",
      PIZZAS.OVEN_TEMP AS "PIZZA_ovenTemp",
      PIZZAS.SPECIAL_INSTRUCTIONS AS "PIZZA_specialInstructions",
      INGREDIENTS.ID AS "INGREDIENT_id",
      INGREDIENTS.TYPE AS "INGREDIENT_ingredientType",
      INGREDIENTS.NAME AS "INGREDIENT_name",
      INGREDIENTS.NOTES AS "INGREDIENT_notes"
    FROM PIZZAS

    LEFT JOIN PIZZA_INGREDIENTS ON PIZZAS.ID = PIZZA_INGREDIENTS.PIZZA_ID
    LEFT JOIN INGREDIENTS ON INGREDIENTS.ID = PIZZA_INGREDIENTS.INGREDIENT_ID`,
};

const postPizzaData = {
  validBody: {
    data: {
      type: 'pizza',
      attributes: {
        name: 'valid pizza',
        ovenTemp: 500,
        bakeTime: 50,
        specialInstructions: '',
      },
    },
  },
  invalidBody: {
    data: {
      type: 'pizza',
      attributes: {
        foo: 'bar',
      },
    },
  },

  postPizzaQuery: dedent`INSERT INTO PIZZAS (NAME, BAKE_TIME, OVEN_TEMP, SPECIAL_INSTRUCTIONS, DOUGH_ID)
    VALUES (:name, :bakeTime, :ovenTemp, :specialInstructions, :doughId)
  RETURNING ID, NAME, OVEN_TEMP, BAKE_TIME, SPECIAL_INSTRUCTIONS
  INTO :idOut, :nameOut, :ovenTempOut, :bakeTimeOut, :specialInstructionsOut`,

  postPizzaBindParams: {
    idOut: { type: 2002, dir: 3003 },
    nameOut: { type: 2001, dir: 3003 },
    ovenTempOut: { type: 2002, dir: 3003 },
    bakeTimeOut: { type: 2002, dir: 3003 },
    specialInstructionsOut: { type: 2001, dir: 3003 },
    name: 'valid pizza',
    ovenTemp: 500,
    bakeTime: 50,
    specialInstructions: '',
    doughId: null,
  },

  validQueryReturn: {
    outBinds:
    {
      idOut: [82],
      nameOut: ['test POST pizza'],
      ovenTempOut: [500],
      bakeTimeOut: [10],
      specialInstructionsOut: ['test'],
    },
  },

  normalizedDbReturn: {
    id: 82,
    name: 'test POST pizza',
    bakeTime: 10,
    ovenTemp: 500,
    specialInstructions: 'test',
  },

  testIngredientsData: {
    data: [
      {
        id: '1',
        type: 'ingredient',
      },
    ],
  },
  testDoughData: {
    data: {
      id: '1',
      type: 'dough',
    },
  },
  postPizzaBindParamsWithDough: {
    idOut: { type: 2002, dir: 3003 },
    nameOut: { type: 2001, dir: 3003 },
    ovenTempOut: { type: 2002, dir: 3003 },
    bakeTimeOut: { type: 2002, dir: 3003 },
    specialInstructionsOut: { type: 2001, dir: 3003 },
    name: 'valid pizza',
    ovenTemp: 500,
    bakeTime: 50,
    specialInstructions: '',
    doughId: '1',
  },

  oracleDbDoughError: {
    errorNum: 2291,
    message: 'oracleDB error',
    offset: 0,
  },

  insertSingleIngredientQuery: dedent`
  INSERT ALL
          INTO PIZZA_INGREDIENTS (INGREDIENT_ID, PIZZA_ID)
  VALUES (:ingredientId1, :pizzaId)
        SELECT * FROM dual
  `,
};

export {
  getDoughsData,
  postDoughsData,
  getDoughByIdData,
  updateDoughsByIdData,
  getIngredientsData,
  postIngredientData,
  getIngredientByIdData,
  updateIngredientByIdData,
  getPizzasData,
  getPizzaByIdData,
  processGetFiltersData,
  doughSerializerData,
  ingredientSerializerData,
  serializePizzaData,
  postPizzaData,
};
