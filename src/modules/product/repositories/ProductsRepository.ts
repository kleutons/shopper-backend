import { Request, Response } from 'express';
import { handleDatabaseError, pool } from '../../../mysql';
import { IdProductsRequest, TypeProduct, TypeProductValidade } from '../../../types/products';
import { PoolConnection, QueryError, FieldPacket, RowDataPacket } from 'mysql2';
import { Readable }  from "stream";
import readline from "readline";
import { convertDBValuesToNumbers} from '../../../utils/utils';
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
                    const products: TypeProduct[] = resultQuery.map(convertDBValuesToNumbers);
                    res.status(200).json(products);
                }
            )
        })
    }
    
    listPack(req: Request, res: Response) {
        
        pool.getConnection((err:NodeJS.ErrnoException | null, connection: PoolConnection | undefined) =>{
            //Retorna se tiver erro ao conectar na poll
            handleDatabaseError(err, res); 

            const query = 'SELECT * FROM products WHERE code IN (SELECT DISTINCT pack_id FROM packs)';

            connection!.query(query,
                (errorQuery:  QueryError | null, resultQuery: any, filedsQuery: FieldPacket[]) => {
                    //encerrar connection 
                    connection!.release();
                    
                    if(errorQuery){
                        console.log(errorQuery);
                        return res.status(400).json({error: 'Erro ao consultar base de dados!'});
                    }
                    const products: TypeProduct[] = resultQuery.map(convertDBValuesToNumbers);
                    res.status(200).json(products);
                }
            )
        })
    }
    

    async selectProductCode(codeProduct: number): Promise<TypeProduct | null> {
        return new Promise((resolve, reject) => {
            pool.getConnection((err: NodeJS.ErrnoException | null, connection: PoolConnection | undefined) => {
                if (err) {
                    // Retornar um erro caso haja problemas com a conexão
                    reject(err);
                    return;
                }
                
                
                const query = 'SELECT * FROM products WHERE code = ?';
    
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
                            const product = convertDBValuesToNumbers(resultQuery[0]);
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
    
                        products = resultQuery.map(convertDBValuesToNumbers);
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
            let validationMessages: string[] = [];

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
                        isValidade: false,
                        errorValidade: validLine
                    });
                }else{

                    const codeProduct = Number(lineCsv[0]);
                    const newPrice = Number(lineCsv[1]);
  

                    try {
                        const selectProduct = await this.selectProductCode(codeProduct);

                        const commonProductData = {
                            code: selectProduct ? selectProduct.code : codeProduct,
                            name: selectProduct ? selectProduct.name : 'não encontrado',
                            cost_price: selectProduct ? selectProduct.cost_price : 0,
                            sales_price: selectProduct ? selectProduct.sales_price : 0,
                            new_price: newPrice,
                            isValidade: validationMessages.length !== 0,
                            errorValidade: validationMessages.length > 0 ? validationMessages.join(', ') : 'Produto Não Encontrado',
                        };

                        if (selectProduct) {
                            const cost_Price = selectProduct.cost_price;
                            const sales_Price = selectProduct.sales_price;
                            const validValuesLine = check_ValuesLine(newPrice, sales_Price, cost_Price);
                    
                            if (validValuesLine){
                                // Lógica para lidar com erros de validação 
                                commonProductData.errorValidade = validValuesLine;
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