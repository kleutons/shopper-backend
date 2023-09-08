import { PackArray, TypeProductValidade } from "../types/products";

const limitColumns = 2;
function check_numberColumns(lineCsv: Array<number | string>): boolean {
    return lineCsv.length !== limitColumns;
}

export function check_HeaderLine(line: string[]): null | string{
    let validationMessages: string[] = [];

    if(check_numberColumns(line)){
        validationMessages.push(`Cabeçalho inválido - número de colunas (${line.length}) diferente do permitido ${limitColumns}`);
    }
    if (line[0].trim() !== 'product_code') {
        validationMessages.push('Cabeçalho product_code não encontrado');
    }

    if (line[1].trim() !== 'new_price') {
        validationMessages.push('Cabeçalho new_price não encontrado');
    }

    // Se não houver mensagens de validação, retorne null
    return validationMessages.length > 0 ? validationMessages.join(', ') : null;

}

export function check_ValuesIsValid(line: Array<number | string>){
    let validationMessages: string[] = [];
    const code = Number(line[0]);
    const newPrice = Number(line[1]);

    if(check_numberColumns(line)){
        validationMessages.push(`Linha inválida - número de colunas (${line.length}) excede o limite de ${limitColumns}`);
    }
    if (isNaN(code) || code <= 0) {
        validationMessages.push('Código do produto inválido');
    }
    if (isNaN(newPrice)) {
        validationMessages.push('Novo Preço inválido');
    }
    
    if (newPrice <= 0) {
        validationMessages.push('Novo Preço não pode menor que zero');
    }

    return validationMessages.length > 0 ? validationMessages.join(', ') : null;
}

export function check_ValuesLine(newPrice: number, salesPrice:number, costPrice:number): null | string{
    let validationMessages: string[] = [];

    if(check_LowerCostPrice(costPrice, newPrice)){
        validationMessages.push('Novo preço abaixo do custo ('+costPrice+')');
    }

    if(check_PriceAdjustment(salesPrice, newPrice)){
        validationMessages.push('Variação ultrapassa +/-10% o preço atual');
    }

    return validationMessages.length > 0 ? validationMessages.join(', ') : null;
    
}

function check_LowerCostPrice(costPrice: number, newPrice: number): boolean {
    // Essa Função é melhor se newPrice <= costPrice, porém o desafio pede somente para verificar se é abaixo < do custo
    return newPrice <= costPrice; // true | false
}

function check_PriceAdjustment(price: number, newPrice: number): boolean {
    const maxAdjustment = price * 0.10; // 10% do preço atual
    const lowPrice = price - maxAdjustment;
    const bigPrice = price + maxAdjustment;

    // O reajuste está dentro do limite de +/-10%
    return newPrice < lowPrice || newPrice > bigPrice;
}


export function check_SumKitAndPackExist(listPacks: PackArray[], listProducts: TypeProductValidade[]): TypeProductValidade[]{
    listPacks.forEach((pack: PackArray) => {
        for (const key in pack) {
        
            const existsInProductsValidade = pack[key].some((element) =>
                listProducts.some((obj) => obj.code === element)
            );

            const produto = listProducts.find(item => item.code === Number(key));
            if (!existsInProductsValidade && produto) {
                produto.returnError += ", CSV não contém os novos preços do componentes desse kit";
            }
        }
    });

    return listProducts;
}

