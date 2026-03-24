const fs = require("fs");

function saveData(data, fileName){
    return new Promise((resolve,reject)=>{
        fs.writeFile(fileName,JSON.stringify(data,null,3),(error)=>{
            if(error) reject(error.message);
            resolve();
        });
    });
};

function getData(dir){
    return new Promise((resolve, reject)=>{
        fs.readFile(dir,(error,data)=>{
            if(error) reject(error.message);
            resolve(JSON.parse(data.toString()));
        });
    });
};

function auth(req,res,next){
    if(!req.session.account.auth){
        return res.status(401).json({success: false, message: "Unauthorized"});
    }
    next();
};


module.exports = {getData, saveData, auth};