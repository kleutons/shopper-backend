import { Request, Response } from 'express';
import { handleDatabaseError, pool } from '../../../mysql';
import { IdProductsRequest } from '../../../types/products';
import { PoolConnection, QueryError, FieldPacket } from 'mysql2';

class ProductRepository {
    listUnique(req: Request<{}, {}, IdProductsRequest>, res: Response) {

        pool.getConnection((err:NodeJS.ErrnoException | null, connection: PoolConnection | undefined) =>{
            //Retorna se tiver erro ao conectar na poll
            handleDatabaseError(err, res); 
            const query = 'SELECT * FROM products WHERE code NOT IN (SELECT DISTINCT pack_id FROM packs)';

            connection!.query(query,
                (errorQuery:  QueryError | null, resultQuery: any, filedsQuery: FieldPacket[]) => {
                    //encerrar connection 
                    connection!.release();
                    
                    if(errorQuery){
                        console.log(errorQuery);
                        return res.status(400).json({error: 'Erro ao consultar base de dados!'});
                    }
                    res.status(200).json(resultQuery);
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
                    res.status(200).json(resultQuery);
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

        // res.status(200).json(idsArray);

        pool.getConnection((err:NodeJS.ErrnoException | null, connection: PoolConnection | undefined) =>{
            //Retorna se tiver erro ao conectar na poll
            handleDatabaseError(err, res); 

            const query = 'SELECT * FROM products WHERE code IN (?)';

            connection!.query( 
                query,
                [idsArray],
                (errorQuery:  QueryError | null, resultQuery: any, filedsQuery: FieldPacket[]) => {
                    //encerrar connection 
                    connection!.release();
                    
                    if(errorQuery){
                        console.log(errorQuery);
                        return res.status(400).json({error: 'Erro ao consultar base de dados!'});
                    }
                    res.status(200).json(resultQuery);
                }
            )
        })
    }

    bulkUpdateCSV(req: Request, res: Response) {
        res.status(200).json({resposta: 'Bulk update!'})
    }
}

export { ProductRepository }