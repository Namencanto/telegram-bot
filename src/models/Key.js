export default (sequelize, DataTypes) => {
    const Keys = sequelize.define('Keys', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mm: {
        type: DataTypes.STRING(2),
        allowNull: false,
      },
      yyyy: {
        type: DataTypes.STRING(4),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      otherinfo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      stock_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Stocks',
          key: 'id',
        },
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
  
    return Keys;
  };
  