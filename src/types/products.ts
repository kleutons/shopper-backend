export type IdProductsRequest = {
    id: string;
  }
  
export type TypeProduct = {
    code: number;
    name: string;
    cost_price: number;
    sales_price: number;
};

export type TypeProductCSV = {
  code: number;
  new_price: number;
};

export interface TypeProductNewPrice extends TypeProduct {
  new_price: number;
}

export interface TypeProductValidade extends TypeProduct {
  new_price: number;
  isValidade: boolean;
  errorValidade?: string;
}