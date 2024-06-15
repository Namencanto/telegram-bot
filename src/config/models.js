import { initializeDatabase } from "./index.js";
const db = await initializeDatabase();

db.Deposits.belongsTo(db.Users, {
  foreignKey: "user_id",
  targetKey: "telegram_id",
});
db.Transactions.belongsTo(db.Users, {
  foreignKey: "user_id",
  targetKey: "telegram_id",
});
db.Users.hasMany(db.Deposits, {
  foreignKey: "user_id",
  sourceKey: "telegram_id",
});
db.Users.hasMany(db.Transactions, {
  foreignKey: "user_id",
  sourceKey: "telegram_id",
});
db.Stocks.hasMany(db.Keys, { foreignKey: 'stock_id', as: 'Keys' });
db.Keys.belongsTo(db.Stocks, { foreignKey: 'stock_id' });


export const User = db.Users;
export const Deposit = db.Deposits;
export const Key = db.Keys;
export const Transaction = db.Transactions;
export const Stock = db.Stocks;
