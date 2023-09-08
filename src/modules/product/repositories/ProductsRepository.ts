import { Request, Response } from 'express';
import { handleDatabaseError, pool } from '../../../mysql';
import { ComposeKit, EnumTypeProduct, IdProductsRequest, PackArray, TypePack, TypeProduct, TypeProductValidade } from '../../../types/products';
import { PoolConnection, QueryError, FieldPacket, RowDataPacket } from 'mysql2';
import { Readable }  from "stream";
import readline from "readline";
import { convertDBPacks, convertDBProducts } from '../../../utils/utils';
import multer from 'multer';
import { check_HeaderLine, check_SumKitAndPackExist, check_ValuesIsValid, check_ValuesLine } from '../../../utils/validade';
const upload = multer();

class ProductRepository {
    listUnique(req: Request<{}, {}, IdProductsRequest>, res: Response) {

        pool.getConnection((err:NodeJS.ErrnoException | null, connection: PoolConnection | undefined) =>{
            //Retorna se tiver erro ao conectar na poll
            handleDatabaseError(err, res); 
            const query = 'SELECT * FROM products WHERE code NOT IN (SELECT DISTINCT pack_id FROM packs)';

            connection!.query(query,
                (errorQuery:  QueryError | null, resultQuery: RowDataPacket[], filedsQuery: FieldPacket[]) => {
                    //encerrar connection 
                    connection!.release();
                    
                    if(errorQuery){
                        console.log(errorQuery);
                        return res.status(400).json({error: 'Erro ao consultar base de dados!'});
                    }
                    // Convert para exibir numeros decimais com Number
                    const products: TypeProduct[] = resultQuery.map(convertDBProducts);
                    res.status(200).json(products);
                }
            )
        })
    }
    
    listPack(req: Request, res: Response) {
        
        pool.getConnection((err:NodeJS.ErrnoException | null, connection: PoolConnection | undefined) =>{
            //Retorna se tiver erro ao conectar na poll
            handleDatabaseError(err, res); 

            const query = 'SELECT p.* FROM products p INNER JOIN packs pk ON p.code = pk.pack_id';

            connection!.query(query,
                (errorQuery:  QueryError | null, resultQuery: any, filedsQuery: FieldPacket[]) => {
                    //encerrar connection 
                    connection!.release();
                    
                    if(errorQuery){
                        console.log(errorQuery);
                        return res.status(400).json({error: 'Erro ao consultar base de dados!'});
                    }
                    // Convert para exibir numeros decimais com Number
                    const products: TypeProduct[] = resultQuery.map(convertDBProducts);
                    res.status(200).json(products);
                }
            )
        })
    }

    async listPackIDProducts(idPack: number): Promise<TypePack[] | null> {
        return new Promise((resolve, reject) => {
            pool.getConnection((err: NodeJS.ErrnoException | null, connection: PoolConnection | undefined) => {
                if (err) {
                    // Retornar um erro caso haja problemas com a conexão
                    reject(err);
                    return;
                }
                const query = 'SELECT pk.pack_id, pk.product_id, pk.qty FROM packs pk INNER JOIN products p ON p.code = pk.product_id WHERE pack_id = ?';
                connection!.query(
                    query,
                    idPack,
                    (errorQuery: QueryError | null, resultQuery: RowDataPacket[], filedsQuery: FieldPacket[]) => {
                        connection!.release();
    
                        if (errorQuery) {
                            
                            reject(errorQuery);
                            return;
                        }
    
                        if (resultQuery.length === 0) {
                            resolve(null);
                        } else {
                            // Convert para exibir numeros decimais com Number
                            const product = resultQuery.map(convertDBPacks);
                            resolve(product);
                        }
                    }
                );
            });
        });
    }
    

    async selectProductCode(codeProduct: number): Promise<TypeProduct | null> {
        return new Promise((resolve, reject) => {
            pool.getConnection((err: NodeJS.ErrnoException | null, connection: PoolConnection | undefined) => {
                if (err) {
                    // Retornar um erro caso haja problemas com a conexão
                    reject(err);
                    return;
                }
                
                
                const query = 'SELECT p.*, (pk.product_id IS NOT NULL) AS kit_status FROM products p LEFT JOIN packs pk ON p.code = pk.product_id WHERE p.code = ?';
    
                connection!.query(
                    query,
                    codeProduct,
                    (errorQuery: QueryError | null, resultQuery: RowDataPacket[], filedsQuery: FieldPacket[]) => {
                        connection!.release();
    
                        if (errorQuery) {
                            
                            reject(errorQuery); // Rejeitar a Promise em caso de erro na consulta
                            return;
                        }
    
                        if (resultQuery.length === 0) {
                            resolve(null); // Não há resultados, então retornamos null
                        } else {
                            const product = convertDBProducts(resultQuery[0]);
                            resolve(product); // Resolver a Promise com o produto encontrado
                        }
                    }
                );
            });
        });
    }

    async listByCodeProduct(codeProducts: string): Promise<TypeProduct[] > {
        return new Promise((resolve, reject) => {
            const splitString = codeProducts.split(',');
            const codeProductsNumber = splitString.map(Number);
    
            let products: TypeProduct[] = [];
            
            
            pool.getConnection((err: NodeJS.ErrnoException | null, connection: PoolConnection | undefined) => {
                if (err) {
                    // Retornar um erro caso haja problemas com a conexão
                    reject(err);
                    return;
                }
    
                const query = 'SELECT * FROM products WHERE code IN (?)';
    
                connection!.query(
                    query,
                    [codeProductsNumber],
                    (errorQuery: QueryError | null, resultQuery: RowDataPacket[], filedsQuery: FieldPacket[]) => {
                        connection!.release();
    
                        if (errorQuery) {
                            console.log(errorQuery);
                            reject(errorQuery); // Rejeitar a Promise em caso de erro na consulta
                            return;
                        }
    
                        products = resultQuery.map(convertDBProducts);
                
                        resolve(products); // Resolver a Promise com os produtos encontrados
                    }
                );
            });
        });
    }
    

    async bulkUpdateCSV(req: Request, res: Response) {
        const fileCSV = req.file;
        if(!fileCSV){
           return res.status(404).json({ error: 'Nenhum arquivo foi enviado.'})
        }else
        if(fileCSV.mimetype !== 'text/csv'){
           return res.status(404).json({ error: 'Arquivo Enviado nao é um CSV.'})
        }

        const readableFile = new Readable();
        readableFile.push(fileCSV.buffer); 
        readableFile.push(null);

        const csv = readline.createInterface({
           input: readableFile
        })

        const productsValidade: TypeProductValidade[] = [];
        const productsPacks: TypePack[] = [];

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
                    return res.status(404).json({ error: errorHeader});
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
                        const selectProduct = await this.selectProductCode(codeProduct);

                        const selectProductPack = await this.listPackIDProducts(codeProduct);
                        
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
                        res.status(404).json({error: 'Ocorreu um erro ao selecionar o produto:' + error});
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
                console.log('Code: ' + codProdct);
              let sumNewPrice = 0;
              itemKit.composeKit.forEach((component) => {
                    const produtoKit = productsValidade.find(itemF => itemF.code === component.idProduct);
                    if (produtoKit) {
                        console.log(produtoKit.code);
                        existProductKit = true;
                        sumNewPrice += component.qty * produtoKit.new_price
                    }else{
                        existProductKit = false;
                    }
                });
              console.log('existProductKit: '+existProductKit);
              const resultSum = Number(sumNewPrice.toFixed(2));
              console.log(resultSum);
              console.log(itemKit.new_price);
              console.log(itemKit.new_price == resultSum);
              
              //busca produto para edição do erro
              const produtoError = productsValidade.find(item => item.code === codProdct);
              //Existe todos os produtos?
              if(!existProductKit && produtoError){
                produtoError.returnError += ", CSV não contém os novos preços do componentes desse kit";
              }else
              if(existProductKit && itemKit.new_price !== resultSum && produtoError){
                 produtoError.returnError += ", A soma dos preços dos Componetes desse Kit está incorreta: ("+resultSum+")";
              }

            }
            
        })
        
        res.status(200).json(productsValidade);
    }


}

export { ProductRepository }