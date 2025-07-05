const { Sequelize, Model, DataTypes } = require('sequelize');

// Função para converter string em booleano
const strToBool = (value) => value === 'true';

const DB_DATABASE = process.env.DB_DATABASE || "kubedevnews";
const DB_USERNAME = process.env.DB_USERNAME || "kubedevnews";
const DB_PASSWORD = process.env.DB_PASSWORD || "Pg#123";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = parseInt(process.env.DB_PORT, 10) || 5432; 
const DB_SSL_REQUIRE = strToBool(process.env.DB_SSL_REQUIRE) || false;

const sequelize = new Sequelize(DB_DATABASE, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  dialectOptions: DB_SSL_REQUIRE
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : {}
});

class Post extends Model {}

Post.init({
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  summary: {
    type: DataTypes.STRING,
    allowNull: false
  },
  publishDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  content: {
    type: DataTypes.STRING(2000),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Post'
});

const initDatabase = () => {
  return sequelize.sync({ alter: true });
};

module.exports = {
  Post,
  initDatabase
};
