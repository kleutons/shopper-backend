import readline from "readline";
import { ComposeKit, EnumTypeProduct, TypeProductValidade } from "../../../types/products";
import { check_HeaderLine, check_ValuesIsValid, check_ValuesLine } from "../../../utils/validade";
import { ProductRepository } from "./ProductsRepository";


export async function validadeCVS(csv: readline.Interface){
    let isValidadeFile: boolean = false;
    let msgError: string | null = null;

    const repository = new ProductRepository();
  
        const productsValidade: TypeProductValidade[] = [];

        let headerLine = true;
        for await (let line of csv) {
            
            // Ignorar linhas vazias
            if (line.trim() === '' || line.trim() === ';') {
                continue;
            }
            
            // console.log('Linha lida:', line); 
            const lineCsv = line.split(',');

             if (headerLine){
                headerLine = false;
                const errorHeader = check_HeaderLine(lineCsv);
                if(errorHeader){
                    isValidadeFile = true;
                    msgError = errorHeader;  
                }
             }else{
                
                //valida se dados preenchidos no csv estão corretos, 
                const validLine = check_ValuesIsValid(lineCsv);
                if(validLine){

                    productsValidade.push({
                        code: Number(lineCsv[0]),
                        name: 'não encontrado',
                        cost_price: 0,
                        sales_price: 0,
                        new_price: Number(lineCsv[1]),
                        typeProduct: EnumTypeProduct.UNIQUE,
                        composeKit: null,
                        isError: true,
                        returnError: validLine
                    });
                }else{

                    const codeProduct = Number(lineCsv[0]);
                    const newPrice = Number(lineCsv[1]);
  

                    try {
                        const selectProduct = await repository.selectProductCode(codeProduct);

                        const selectProductPack = await repository.listPackIDProducts(codeProduct);
                        
                        // Se o produto é um kit - armazena os dados
                        const packComposeKit: ComposeKit[] = [];
                        if(selectProductPack){
                            selectProductPack.forEach((item) => {
                                const generateKit: ComposeKit = {
                                    idProduct: item.product_id,
                                    qty: item.qty
                                }
                                packComposeKit.push(generateKit);
                            });
                        }
                        
                        

                        const commonProductData = {
                            code: selectProduct ? selectProduct.code : codeProduct,
                            name: selectProduct ? selectProduct.name : 'Não encontrado',
                            cost_price: selectProduct ? selectProduct.cost_price : 0,
                            sales_price: selectProduct ? selectProduct.sales_price : 0,
                            new_price: newPrice,
                            typeProduct: selectProductPack ? EnumTypeProduct.KIT : selectProduct?.kit_status ? EnumTypeProduct.ComposeKit : EnumTypeProduct.UNIQUE,
                            composeKit: selectProductPack ? packComposeKit : null,
                            isError: selectProduct ? false : true,
                            returnError: selectProduct ? '' : 'Produto Não Encontrado',
                        };

                        if (selectProduct) {
                            const cost_Price = selectProduct.cost_price;
                            const sales_Price = selectProduct.sales_price;
                            const validValuesLine = check_ValuesLine(newPrice, sales_Price, cost_Price);
                    
                            if (validValuesLine){
                                // Lógica para lidar com erros de validação 
                                commonProductData.isError = true;
                                commonProductData.returnError = validValuesLine;
                            }
                        }

                        productsValidade.push(commonProductData);
                    
                    } catch (error) {    
                        isValidadeFile = true;
                        msgError = 'Ocorreu um erro ao selecionar o produto:' + error;                        
                        return;
                    }

                }
                
             }
        }

        

        // Valida e Todosos Produtos do Kit e Soma o Total do Kit
        productsValidade.forEach((itemKit: TypeProductValidade) =>{
            
            let existProductKit = false;
            if(itemKit.composeKit){
                const codProdct = itemKit.code
                
              let sumNewPrice = 0;
              itemKit.composeKit.forEach((component) => {
                    const produtoKit = productsValidade.find(itemF => itemF.code === component.idProduct);
                    if (produtoKit) {
                        existProductKit = true;
                        sumNewPrice += component.qty * produtoKit.new_price
                    }else{
                        existProductKit = false;
                    }
                });
              const resultSum = Number(sumNewPrice.toFixed(2));
   
              //busca produto para edição do erro
              const produtoError = productsValidade.find(item => item.code === codProdct);
              //Existe todos os produtos?
              if(!existProductKit && produtoError){
                produtoError.isError = true;
                produtoError.returnError += ", CSV não contém os novos preços do componentes desse kit";
              }else
              if(existProductKit && itemKit.new_price !== resultSum && produtoError){
                produtoError.isError = true; 
                produtoError.returnError += ", A soma dos preços dos Componetes desse Kit está incorreta: ("+resultSum+")";
                 
              }

            }
            
        })
        
        const isValid = productsValidade.find(item => item.isError === true);
        isValidadeFile = isValid ? true : false;
        msgError = isValid ? 'Csv Invalid' : msgError;


        return { 
            response: productsValidade ? productsValidade : null,
            isValidade: isValidadeFile,
            msgError: msgError
        }

}