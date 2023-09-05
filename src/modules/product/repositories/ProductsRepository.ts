import { Request, Response } from 'express';

class ProductRepository {
    selectAllUnique(req: Request, res: Response) {
        const data = { name: 'Produtos Únicos' };
        res.json(data);
    }
    
    selectAllPack(req: Request, res: Response) {
        const data = { name: 'Produtos Pack' };
        res.json(data);
    }
}

export { ProductRepository }