import express from 'express';
const bodyParser = require('body-parser');
import { productRoutes } from './routes/product.routes';

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
    // Permite acesso de qualquer origem (não seguro somente para produção)
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'); 
    res.header('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE, OPTIONS'); 
    next();
});
  

app.get('/', (req, res) => {
    res.send("Servidor Iniciado com sucesso!");
});


app.use('/product', productRoutes);

const port = 4000;
app.listen(port, () => {
    console.log('Servidor rodando na porta:' + port);
});