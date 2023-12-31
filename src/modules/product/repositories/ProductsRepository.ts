import { Request, Response } from 'express';
import { handleDatabaseError, pool } from '../../../mysql';
import { IdProductsRequest, TypePack, TypeProduct, TypeUpdateDB } from '../../../types/products';
import { PoolConnection, QueryError, FieldPacket, RowDataPacket } from 'mysql2';
import { Readable }  from "stream";
import readline from "readline";
import { convertDBPacks, convertDBProducts } from '../../../utils/utils';
import multer from 'multer';

import { validadeCVS } from './ValidadeCSV';
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

            const query = 'SELECT * FROM products WHERE code IN (SELECT DISTINCT pack_id FROM packs)';

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
    

    async postValidadeCSV(req: Request, res: Response) {
        const fileCSV = req.file;

        if(fileCSV === undefined) {
            return res.status(400).json({ error: 'Nenhum arquivo foi enviado.'})
        }

        if(fileCSV.mimetype !== 'text/csv'){
           return res.status(400).json({ error: 'Arquivo Enviado nao é um CSV.'})
        }

        if(fileCSV.mimetype === 'text/csv'){
            
            const readableFile = new Readable();
            readableFile.push(fileCSV.buffer); 
            readableFile.push(null);
    
            const csv = readline.createInterface({
               input: readableFile
            })
    
    
            
            validadeCVS(csv)
            .then((resultado) => {
                if(resultado){
    
                    res.status(200).json(resultado.response);
                }
            })
            .catch((error) => {
              console.error(error);
              res.status(400).json({eroor: 'Erro ao validar CSV'});
            });
        }

        
    }


    async bulkUpdateCSV(req: Request, res: Response) {
        const fileCSV = req.file;
        if(!fileCSV){
           return res.status(400).json({ error: 'Nenhum arquivo foi enviado.'})
        }else
        if(fileCSV.mimetype !== 'text/csv'){
           return res.status(400).json({ error: 'Arquivo Enviado nao é um CSV.'})
        }

        const readableFile = new Readable();
        readableFile.push(fileCSV.buffer); 
        readableFile.push(null);

        const csv = readline.createInterface({
           input: readableFile
        })


        
        validadeCVS(csv)
        .then((resultado) => {
            if(resultado){
                //CSV é Valido, presseguir
                if(!resultado.isValidade){
                   

                    if(resultado.response){
                        const updateDB = resultado.response.map((item:TypeUpdateDB):TypeUpdateDB=>{ 
                            return {
                                code: item.code,
                                new_price: item.new_price
                            };
                            
                        });

                        
                        this.bulkUpdateDB(updateDB)
                        .then((result) => {
                            console.log('Atualização realizada com sucesso!', result);
                            res.status(200).json({ data: 'Atualização realizada com sucesso!'});
                        })
                        .catch((error) => {
                            console.error('Erro ao realizar atulização!', error);
                            res.status(400).json({ error: 'Erro ao realizar atulização!'});
                        });
                    }

                    

                }else{
                    res.status(400).json({error: resultado.msgError});
                }
            }
        })
        .catch((error) => {
          console.error(error);
          res.status(400).json({eroor: 'Erro ao validar CSV'});
        });
        
    }
    
    async bulkUpdateDB(updateDB:TypeUpdateDB[]) {
        return new Promise((resolve, reject) => {
          pool.getConnection((err, connection) => {
            if (err) {
              reject(err);
              return;
            }
      
            // Iniciar uma transação para garantir que todas as atualizações sejam bem-sucedidas ou nenhuma seja realizada
            connection.beginTransaction((beginErr) => {
              if (beginErr) {
                connection.release();
                reject(beginErr);
                return;
              }
      
              // Eecutar as atualizações para cada elemento
              for (const item of updateDB) {
                const { code, new_price } = item;
      
                const query = 'UPDATE products SET sales_price = ? WHERE code = ?';
                connection.query(
                  query,
                  [new_price, code],
                  (errorQuery, resultQuery) => {
                    if (errorQuery) {
                      connection.rollback(() => {
                        connection.release();
                        reject(errorQuery);
                      });
                      return;
                    }
                  }
                );
              }
      
              // Commit da transação se todas as atualizações forem bem-sucedidas
              connection.commit((commitErr) => {
                if (commitErr) {
                  connection.rollback(() => {
                    connection.release();
                    reject(commitErr);
                  });
                  return;
                }
      
                connection.release();
                resolve(true); // Resolver a Promise com sucesso
              });
            });
          });
        });
    }



}

export { ProductRepository }