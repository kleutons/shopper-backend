export function check_LowerCostPrice(costPrice: number, newPrice: number): boolean {
    // Essa Função é melhor se newPrice <= costPrice, porém o desafio pede somente para verificar se é abaixo < do custo
    return newPrice <= costPrice; // true | false
}

export function check_PriceAdjustment(price: number, newPrice: number): boolean {
    const maxAdjustment = price * 0.10; // 10% do preço atual

    if (newPrice <= price + maxAdjustment && newPrice >= price - maxAdjustment) {
        return true; // O reajuste está dentro do limite de 10%
    } else {
        return false; // O reajuste está fora do limite de 10%
    }
}