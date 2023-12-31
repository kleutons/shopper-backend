export type IdProductsRequest = {
    id: string;
  }
  
export type TypeProduct = {
    code: number;
    name: string;
    cost_price: number;
    sales_price: number;
    kit_status?: boolean;
};

export type TypeProductCSV = {
  code: number;
  new_price: number;
};

export interface TypeProductNewPrice extends TypeProduct {
  new_price: number;
}

export enum EnumTypeProduct {
  UNIQUE = 'unitário',
  KIT = 'kit',
  ComposeKit = 'compõe um kit',
};


export type ComposeKit = {
  idProduct: number;
  qty: number;
}

export interface TypeProductValidade extends TypeProduct {
  new_price: number;
  typeProduct: EnumTypeProduct;
  composeKit:ComposeKit[] | null;
  isError: boolean;
  returnError?: string;
}

export type TypePack = {
  pack_id: number;
  product_id: number;
  qty: number;
}

export interface TypePackValidade extends TypePack {
  new_price: number;
}

export type PackArray = {
  [key: number]: number[];
}

export type TypeUpdateDB = {
  code: number;
  new_price: number;
}
