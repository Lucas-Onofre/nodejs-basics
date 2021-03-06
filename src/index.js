const { response } = require('express');
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

  //estamos repassando tudo dentro da request
  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) =>{
    if(operation.type === 'credit'){
      return acc + operation.amount;
    } else{
      return acc - operation.amount;
    }
  }, 0);

  return balance;
};

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

app.post("/deposit", verifyIfAccountExists, (request, response) =>{
  const { description, amount } = request.body;

  const { costumer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  }

  costumer.statement.push(statementOperation);

  return response.status(201).send();
})

app.post("/withdraw", verifyIfAccountExists, (request, response) =>{
  const { description, amount } = request.body;

  const { costumer } = request;

  const balance = getBalance(costumer.statement);

  if(balance < amount){
    return response.status(400).json({error: "Insuficient funds!"})
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit"
  }

  costumer.statement.push(statementOperation);

  return response.status(201).send();
})

app.get("/statement/:date", verifyIfAccountExists, (request, response) =>{
  const { costumer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  // 10/10/2021
  const statement = costumer.statement.filter(statement => statement.created_at.toDateString() === new Date(dateFormat).toDateString())
  
  return response.json(statement);
});

app.put("/account", verifyIfAccountExists, (request, response) => {
  const { name } = request.body;
  const { costumer } = request;

  costumer.name = name;

  return response.status(201).send();
});

app.get("/account", verifyIfAccountExists, (request, response) =>{
  const {costumer} = request;

  return response.json(costumer);
});

app.delete("/account", verifyIfAccountExists, (request, response) =>{
  const { costumer } = request;

  costumers.splice(costumers.indexOf(costumer), 1);

  return response.status(200).json(costumers);
});

app.get("/balance", verifyIfAccountExists, (request, response) =>{
  const { costumer } = request;

  const balance = getBalance(costumer.statement);

  return response.json(balance);
})

app.listen(3333);