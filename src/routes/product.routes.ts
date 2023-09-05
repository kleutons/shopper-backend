import { Router } from "express";
import { ProductRepository } from "../modules/product/repositories/ProductsRepository";

const productRoutes = Router();
const productRepository = new ProductRepository();

productRoutes.get('/all-unique', (req, res) => {
   productRepository.selectAllUnique(req, res);
});

productRoutes.get('/all-pack', (req, res) => {
    productRepository.selectAllPack(req, res);
 });

 productRoutes.post('/bulk-update', (req, res) => {
   productRepository.bulkUpdateCSV(req, res);
});
 

export { productRoutes };