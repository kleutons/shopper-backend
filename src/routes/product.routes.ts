import { Request, Response, Router } from "express";
import { ProductRepository } from "../modules/product/repositories/ProductsRepository";
import multer from 'multer';


const multerConfig = multer();
const productRoutes = Router();
const productRepository = new ProductRepository();

productRoutes.get('/list-unique', (req, res) => {
   productRepository.listUnique(req, res);
});

productRoutes.get('/list-pack', (req, res) => {
    productRepository.listPack(req, res);
 });

productRoutes.post('/validade-csv',
                  multerConfig.single("file"),
                  async (req: Request, res: Response) => {
   
   productRepository.postValidadeCSV(req, res);
});

productRoutes.post('/bulk-update',
                  multerConfig.single("file"),
                  async (req: Request, res: Response) => {
   
   productRepository.bulkUpdateCSV(req, res);
});



export { productRoutes };