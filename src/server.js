const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const promBundle = require("express-prom-bundle");
const middlewares = require('./middleware');
const config = require('./system-life');
const { Post, initDatabase } = require('./models/post');

const metricsMiddleware = promBundle({
  includeMethod: true, 
  includePath: true, 
  includeStatusCode: true, 
  includeUp: true,
  promClient: {
    collectDefaultMetrics: {}
  }
});

// Middlewares
app.use(middlewares.countRequests);
app.use(metricsMiddleware);
app.use(config.middlewares.healthMid);
app.use('/', config.routers);
app.use(express.static('static'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

// Rotas

app.get('/post', (req, res) => {
  res.render('edit-news', { post: { title: "", content: "", summary: "" }, valido: true });
});

app.post('/post', async (req, res) => {
  let valid = true;

  if (
    (req.body.title.length !== 0 && req.body.title.length < 30) &&
    (req.body.resumo.length !== 0 && req.body.resumo.length < 50) &&
    (req.body.description.length !== 0 && req.body.description.length < 2000)
  ) {
    valid = true;
  } else {
    valid = false;
  }

  if (valid) {
    await Post.create({
      title: req.body.title,
      content: req.body.description,
      summary: req.body.resumo,
      publishDate: Date.now()
    });
    res.redirect('/');
  } else {
    res.render('edit-news', { post: { title: req.body.title, content: req.body.description, summary: req.body.resumo }, valido: false });
  }
});

app.post('/api/post', async (req, res) => {
  for (const item of req.body.artigos) {
    await Post.create({
      title: item.title,
      content: item.description,
      summary: item.resumo,
      publishDate: Date.now()
    });
  }
  res.json(req.body.artigos);
});

app.get('/post/:id', async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  res.render('view-news', { post });
});

app.get('/', async (req, res) => {
  const posts = await Post.findAll();
  res.render('index', { posts });
});

// Inicializa conexão com o banco e depois sobe o servidor
initDatabase()
  .then(() => {
    app.listen(process.env.APP_PORT || 8080, () => {
      console.log(`Aplicação rodando na porta ${process.env.APP_PORT || 8080}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao iniciar a aplicação:', err);
  });
