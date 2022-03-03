const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express();

app.use(express.json());

const costumers = [];

//Middleware
function verifyIfAccountExists(request, response, next){
  const { cpf } = request.headers;
  const costumer = costumers.find(costumer => costumer.cpf === cpf);

  if(!costumer){
    return response.status(400).json({ error: "Costumer not found" });
  }

  request.costumer = costumer;

  return next();
}

app.post("/account", (request, response) =>{
  const { cpf, name } = request.body;
  
  const costumerAlreadyExists = costumers.some(costumer => costumer.cpf === cpf)

  if(costumerAlreadyExists){
    return response.status(400).json({ error: "Costumer already exists!" })
  }

  costumers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  });

  return response.status(201).send()
});

//Com app.use(MiddlewareFunction), todas as rotas abaixo da linha passarão pela verificação.
//app.use(verifyIfAccountExists);

//Quando passamos o middleware como parâmetro na requisição, ele funcionará específicamente para a que declaramos.
app.get("/statement", verifyIfAccountExists, (request, response) =>{
  const { costumer } = request;
  
  return response.json(costumer.statement);
});

app.listen(3333);