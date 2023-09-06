import { Request, Response } from 'express';
import { handleDatabaseError, pool } from '../../../mysql';
import { IdProductsRequest, TypeProduct, TypeProductCSV } from '../../../types/products';
import { PoolConnection, QueryError, FieldPacket, RowDataPacket } from 'mysql2';
import { Readable }  from "stream";
import readline from "readline";
import { converDBValuesToNumbers } from '../../../utils/utils';


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

    listById(req: Request, res: Response) {
    
        const { id } = req.body;
        var idsArray = id.split(',');
        for (var i = 0; i < idsArray.length; i++) {
            idsArray[i] = parseInt(idsArray[i].trim());
        }

        pool.getConnection((err:NodeJS.ErrnoException | null, connection: PoolConnection | undefined) =>{
            //Retorna se tiver erro ao conectar na poll
            handleDatabaseError(err, res); 

            const query = 'SELECT * FROM products WHERE code IN (?)';

            connection!.query( 
                query,
                [idsArray],
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
        
        res.status(200).json(productsCSV);

    }
}

export { ProductRepository }