const User = require("../Models/users");
const chat = require("../Models/ChatConnection");


exports.getAllActiveUsers = (req, res, next) => {
  User.findAll({
    where: {
      status: true,
      isAdmin: false,
    },
  })
    .then(async (result) => {
      const response = result.map(async (Users) => {
        return await chat.findOne({ where: { uid: Users.uid } });
      });

      let resultArray = await Promise.all(response);

      res.status(200).json({result:resultArray})
    })
    .catch((err) => {
      res.status(403).json({ status: 0, message: err.message });
    });
};




exports.getChats=(req,res,next)=>{
   let email=req.query.name;

    chat.findOne({where:{client:email}}).then((result)=>{
    
      
      res.status(200).json({result:result});

    }).catch((err)=>console.log(err))


}
