import { Request, Response } from 'express';
import { pool } from '../../../mysql';

class ProductRepository {
    selectAllUnique(req: Request, res: Response) {

        pool.getConnection((err:any, connection: any) =>{
            connection.query( 
                'SELECT * FROM products WHERE code NOT IN (SELECT DISTINCT pack_id FROM packs)',
                [],
                (errorQuery: any, resultQuery: any, filedsQuery: any) => {
                    //encerrar connection 
                    connection.release();
                    
                    if(errorQuery){
                        console.log(errorQuery);
                        return res.status(400).json({error: 'Erro ao consultar base de dados!'});
                    }
                    res.status(200).json(resultQuery);
                }
            )
        })
    }
    
    selectAllPack(req: Request, res: Response) {
        pool.getConnection((err:any, connection: any) =>{
            connection.query( 
                'SELECT * FROM products WHERE code IN (SELECT DISTINCT pack_id FROM packs)',
                [],
                (errorQuery: any, resultQuery: any, filedsQuery: any) => {
                    //encerrar connection 
                    connection.release();
                    
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