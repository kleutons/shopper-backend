import { RowDataPacket } from "mysql2";
import { TypeProduct } from "../types/products";

export function converDBValuesToNumbers(row: RowDataPacket): TypeProduct {
    return {
        code: row.code,
        name: row.name,
        cost_price: parseFloat(row.cost_price),
        sales_price: parseFloat(row.sales_price)
    };
}