import express from 'express';
import { productRoutes } from './routes/product.routes';

const app = express();

app.get('/', (req, res) => {
    res.send("Servidor Iniciado com sucesso!");
});

app.use('/product', productRoutes);


app.listen(4000);