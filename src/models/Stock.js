export default (sequelize, DataTypes) => {
  const Stocks = sequelize.define(
    "Stocks",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      normal_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      bulk_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      bulk_threshold: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      freezeTableName: true,
    }
  );

  return Stocks;
};
