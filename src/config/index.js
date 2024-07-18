import fs from "fs";
import path from "path";
import { Sequelize, DataTypes } from "sequelize";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false, // Set to console.log to see SQL queries
    dialectOptions: {
      ssl: {
        require: false,
      },
    },
  }
);

const db = {};
const modelsDir = path.join(__dirname, "../models");

const loadModels = async () => {
  const files = fs
    .readdirSync(modelsDir)
    .filter((file) => file.indexOf(".") !== 0 && file.slice(-3) === ".js");

  for (const file of files) {
    const module = await import(path.join(modelsDir, file));
    const model = module.default(sequelize, DataTypes);
    db[model.name] = model;
  }

  Object.keys(db).forEach((modelName) => {
    if ("associate" in db[modelName]) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
};

export const initializeDatabase = loadModels;
export default db;
