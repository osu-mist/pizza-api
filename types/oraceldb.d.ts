declare namespace oracledb {
  export interface RawIngredient {
    id: string,
    name: string,
    ingredientType: string,
    notes?: string,
  }

  export interface RawDough {
    id: string,
    name: string,
    gramsFlour: number,
    flourType: string,
    gramsWater: number,
    waterTemp: number,
    gramsYeast: number,
    gramsSalt: number,
    gramsSugar: number,
    gramsOliveOil: number,
    bulkFermentTime: number,
    proofTime: number,
    specialInstructions?: string,
  }

  export interface RawPizza {
    name: string,
    ovenTemp: number,
    bakeTime: number,
    specialInstructions?: string,
    ingredients: [RawIngredient]
    dough?: RawDough
  }
}
