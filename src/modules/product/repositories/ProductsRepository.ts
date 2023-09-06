import { Request, Response } from 'express';
import { handleDatabaseError, pool } from '../../../mysql';
import { IdProductsRequest, TypeProduct, TypeProductCSV, TypeProductNewPrice } from '../../../types/products';
import { PoolConnection, QueryError, FieldPacket, RowDataPacket } from 'mysql2';
import { Readable }  from "stream";
import readline from "readline";
import { converDBValuesToNumbers, mergeArrays } from '../../../utils/utils';
import multer from 'multer';
import { check_LowerCostPrice, check_PriceAdjustment } from '../../../utils/validade';
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
                    const products: TypeProduct[] = resultQuery.map(converDBValuesToNumbers);
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
                    const products: TypeProduct[] = resultQuery.map(converDBValuesToNumbers);
                    res.status(200).json(products);
                }
            )
        })
    }

    // listById(req: Request, res: Response) {
    
    //     const { id } = req.body;
    //     var idsArray = id.split(',');
    //     for (var i = 0; i < idsArray.length; i++) {
    //         idsArray[i] = parseInt(idsArray[i].trim());
    //     }

    //     pool.getConnection((err:NodeJS.ErrnoException | null, connection: PoolConnection | undefined) =>{
    //         //Retorna se tiver erro ao conectar na poll
    //         handleDatabaseError(err, res); 

    //         const query = 'SELECT * FROM products WHERE code IN (?)';

    //         connection!.query( 
    //             query,
    //             [idsArray],
    //             (errorQuery:  QueryError | null, resultQuery: RowDataPacket[], filedsQuery: FieldPacket[]) => {
    //                 //encerrar connection 
    //                 connection!.release();
                    
    //                 if(errorQuery){
    //                     console.log(errorQuery);
    //                     return res.status(400).json({error: 'Erro ao consultar base de dados!'});
    //                 }
                    
    //                 const products: TypeProduct[] = resultQuery.map(converDBValuesToNumbers);
    //                 res.status(200).json(products);
    //             }
    //         )
    //     })
    // }


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
    
                        products = resultQuery.map(converDBValuesToNumbers);
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
     
        const productsLine = readline.createInterface({
           input: readableFile
        })
     
        const productsCSV: TypeProductCSV[] = [];
        let firstLine = true;
     
        for await(let line of productsLine){
           const lineCsv = line.split(',');
           if(firstLine){
              firstLine = false;
           }else{
              productsCSV.push({
                 code: Number(lineCsv[0]),
                 new_price: Number(lineCsv[1])
              })
           }
        }
        const codeArray = productsCSV.map(item => item.code);
        const codeSelect = codeArray.join(', ');
        const selectPrducts = await this.listByCodeProduct(codeSelect);
        const productsNewsPrice: TypeProductNewPrice[] = mergeArrays(selectPrducts, productsCSV);
        
        

        // Percorre o array de produtos para as validações
        productsNewsPrice.map(item => {
            if(check_LowerCostPrice(item.cost_price, item.new_price)){
                console.log('LowerCostPrice True');
            }else{
                console.log('LowerCostPrice False');
            }

            if(check_PriceAdjustment(item.sales_price, item.new_price)){
                console.log('PriceAdjustment True');
            }else{
                console.log('PriceAdjustment False');
            }
        })
      
        
        

        res.status(200).json(productsNewsPrice);

    }
}

export { ProductRepository }