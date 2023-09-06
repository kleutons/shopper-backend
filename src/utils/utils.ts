import { RowDataPacket } from "mysql2";
import { TypeProduct, TypeProductCSV, TypeProductNewPrice } from "../types/products";

export function converDBValuesToNumbers(row: RowDataPacket): TypeProduct {
    return {
        code: row.code,
        name: row.name,
        cost_price: parseFloat(row.cost_price),
        sales_price: parseFloat(row.sales_price)
    };
}

export function mergeArrays(productArray: TypeProduct[], csvArray: TypeProductCSV[]): TypeProductNewPrice[] {
    return productArray.reduce((result, produto) => {
        const newPrice = csvArray.find((item) => item.code === produto.code);

        if (newPrice) {
            // Se encontrarmos um produto correspondente na segunda array, atualizamos o preço
            result.push({ ...produto, new_price: newPrice.new_price });
        } 
         // Se não houver correspondência ou new_price for zero, não adicionamos o produto

        return result;
    }, [] as TypeProductNewPrice[]);
}