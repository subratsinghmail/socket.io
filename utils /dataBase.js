const Sequelize = require('sequelize');


const sequelize = new Sequelize('Chat', 'postgres', '3BHF59G0rKFzb0uWYzyD', {
    host: 'schedassistdb-dev.cryaxoom3tga.us-east-2.rds.amazonaws.com',
    dialect:'postgres' /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */
  });
  

  module.exports=sequelize;