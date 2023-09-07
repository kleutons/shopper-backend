import { RowDataPacket } from "mysql2";
import { TypePack, TypeProduct } from "../types/products";

export function convertDBProducts(row: RowDataPacket): TypeProduct {
    return {
        code: row.code,
        name: row.name,
        cost_price: Number(row.cost_price),
        sales_price: Number(row.sales_price)
    };
}

export function convertDBPacks(row: RowDataPacket): TypePack {
    return {
        pack_id: row.pack_id,
        product_id: row.product_id,
        qty: Number(row.qty),
        cost_price: Number(row.cost_price),
        sales_price: Number(row.sales_price),
        name: row.name
    };
}