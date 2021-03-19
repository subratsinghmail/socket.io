const sequelize=require('../utils /dataBase');
const {DataTypes,Sequelize}=require('sequelize');


const chat=sequelize.define("Chat",{
 uid:{
    type:DataTypes.STRING(120),
    primaryKey:true,
    allowNull:false
 },

 client :{
    type:DataTypes.STRING,
    allowNull:false
 },

 admin:{
     type:DataTypes.STRING,
     allowNull:true  
 },


 roomID:{
      type:DataTypes.STRING,
      allowNull:true
    
 },
 
 chat:{
     type:DataTypes.JSON,
     defaultValue:[],
     allowNull:true
 }

})


module.exports=chat;