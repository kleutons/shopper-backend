import { Request, Response } from 'express';
import { handleDatabaseError, pool } from '../../../mysql';
import { EnumTypeProduct, IdProductsRequest, TypePack, TypeProduct, TypeProductValidade } from '../../../types/products';
import { PoolConnection, QueryError, FieldPacket, RowDataPacket } from 'mysql2';
import { Readable }  from "stream";
import readline from "readline";
import { convertDBPacks, convertDBProducts } from '../../../utils/utils';
import multer from 'multer';
import { check_HeaderLine, check_ValuesIsValid, check_ValuesLine } from '../../../utils/validade';
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
                const query = 'SELECT pk.pack_id, pk.product_id, pk.qty, p.cost_price, p.sales_price, p.name FROM packs pk INNER JOIN products p ON p.code = pk.product_id WHERE pack_id = ?';
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
                        console.log('products: ', products);
    
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
                        isError: true,
                        returnError: validLine
                    });
                }else{

                    const codeProduct = Number(lineCsv[0]);
                    const newPrice = Number(lineCsv[1]);
  

                    try {
                        const selectProduct = await this.selectProductCode(codeProduct);

                        const selectProductPack = await this.listPackIDProducts(codeProduct);
                        
                        const arrayDeProductIds = selectProductPack?.map(item => item.product_id);

                        console.log('aqui 2222222222222222222');
                        console.log(selectProductPack);
                        console.log(arrayDeProductIds);
                        

                        const commonProductData = {
                            code: selectProduct ? selectProduct.code : codeProduct,
                            name: selectProduct ? selectProduct.name : 'Não encontrado',
                            cost_price: selectProduct ? selectProduct.cost_price : 0,
                            sales_price: selectProduct ? selectProduct.sales_price : 0,
                            new_price: newPrice,
                            typeProduct: selectProductPack ? EnumTypeProduct.KIT : selectProduct?.kit_status ? EnumTypeProduct.ComposeKit : EnumTypeProduct.UNIQUE,
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
        res.status(200).json(productsValidade);
    }


}

export { ProductRepository }