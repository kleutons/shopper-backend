import { RowDataPacket } from "mysql2";
import { TypeProduct } from "../types/products";

export function convertDBValuesToNumbers(row: RowDataPacket): TypeProduct {
    return {
        code: row.code,
        name: row.name,
        cost_price: Number(row.cost_price),
        sales_price: Number(row.sales_price)
    };
}