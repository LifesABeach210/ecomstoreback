var express = require("express");
var router = express.Router();
const bcrypt = require('bcryptjs');
const { uuid } = require('uuidv4');
const { blogsDB } = require("../mongo");



const createUser = async (username,passwordHash)=>{
    const collection = await blogsDB.collection('users');
    const user = {
        username:username,
        password:passwordHash,
        uid:uuid()
    }
   try{
      await collection.insertOne(user);
       return true;
   }catch(e){
       console.error(e);
       return false;
   }
    
};

router.post('/create-user', async function(req,res,next){
try{
    const username = req.body.email;
    const password = req.body.password;
    const saltRounds = 5;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password,salt);
    const userCreatedSucess = await createUser(username,hash);
    res.sendStatus(200).json({success:userCreatedSucess});
}catch(e){
    res.status(500).json({success:false,message:"Error"+e});
}




});
















module.exports = router;