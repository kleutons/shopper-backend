import express from 'express';
const bodyParser = require('body-parser');
import { productRoutes } from './routes/product.routes';

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
    // Permite acesso de qualquer origem (não seguro somente para produção)
    res.header('Access-Control-Allow-Origin', '*'); 
    // Outras configurações CORS podem ser adicionadas aqui, como Access-Control-Allow-Methods, Access-Control-Allow-Headers, etc.
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