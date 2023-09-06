import { Router } from "express";
import { ProductRepository } from "../modules/product/repositories/ProductsRepository";

const productRoutes = Router();
const productRepository = new ProductRepository();

productRoutes.get('/list-unique', (req, res) => {
   productRepository.listUnique(req, res);
});

productRoutes.get('/list-pack', (req, res) => {
    productRepository.listPack(req, res);
 });

productRoutes.post('/list', (req, res) => {
   productRepository.listById(req, res);
});

productRoutes.post('/bulk-update', (req, res) => {
   productRepository.bulkUpdateCSV(req, res);
});
 

export { productRoutes };