const sequelize=require('../utils /dataBase');
const {DataTypes,Sequelize}=require('sequelize');


const User=sequelize.define("User",{
uid:{
    type:DataTypes.STRING(120),
    primaryKey:true,
    allowNull:false
},
email:{
   type:DataTypes.STRING(100),
   allowNull:true
},
status:{
    type:DataTypes.BOOLEAN,
    allowNull:false,
    default:true,
},
socketID:{
    type:DataTypes.STRING(120),
    allowNull:true
},
isAdmin:{
    type:DataTypes.BOOLEAN,
    allowNull:false
}

})

module.exports=User