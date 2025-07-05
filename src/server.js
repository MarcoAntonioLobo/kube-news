const express = require('express');
const app = express();
const models = require('./models/post');
const bodyParser = require('body-parser');
const promBundle = require("express-prom-bundle");
const config = require('./system-life');
const middlewares = require('./middleware');

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
  res.render('edit-news', {
    post: { title: "", content: "", summary: "" },
    valido: true
  });
});

app.post('/post', async (req, res) => {
  const { title, resumo, description } = req.body;
  const valid = title && title.length < 30 &&
                resumo && resumo.length < 50 &&
                description && description.length < 2000;

  if (valid) {
    await models.Post.create({
      title,
      content: description,
      summary: resumo,
      publishDate: Date.now()
    });
    res.redirect('/');
  } else {
    res.render('edit-news', {
      post: { title, content: description, summary: resumo },
      valido: false
    });
  }
});

app.post('/api/post', async (req, res) => {
  for (const item of req.body.artigos) {
    await models.Post.create({
      title: item.title,
      content: item.description,
      summary: item.resumo,
      publishDate: Date.now()
    });
  }
  res.json(req.body.artigos);
});

app.get('/post/:id', async (req, res) => {
  const post = await models.Post.findByPk(req.params.id);
  res.render('view-news', { post });
});

app.get('/', async (req, res) => {
  const posts = await models.Post.findAll();
  res.render('index', { posts });
});

// Inicializa DB e só depois sobe o servidor
(async () => {
  try {
    await models.initDatabase();
    app.listen(process.env.APP_PORT || 8080, () => {
      console.log(`Aplicação rodando na porta ${process.env.APP_PORT || 8080}`);
    });
  } catch (err) {
    console.error('Erro ao conectar no banco de dados:', err);
    process.exit(1);
  }
})();
