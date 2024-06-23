export default (sequelize, DataTypes) => {
  const Deposits = sequelize.define('Deposits', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    user_id: {
      type: DataTypes.BIGINT,
      references: {
        model: 'Users',
        key: 'telegram_id',
      },
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(1024),
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    payment_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pay_currency: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    pay_amount: {
      type: DataTypes.DECIMAL(12, 8),
      allowNull: false,
    },
    confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    full_details: {
      type: DataTypes.JSON,
      allowNull: true,
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
  }, {
    freezeTableName: true,
  });

  return Deposits;
};
