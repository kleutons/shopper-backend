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