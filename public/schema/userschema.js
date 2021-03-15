var mongoose=require("mongoose"),
passportLocalmongoose=require("passport-local-mongoose");
var UserSchema=new mongoose.Schema({
    username: {type:String, unique:true},
    password:String,
	email:String,
	uniqueCode:{type:String, unique:true},
	phoneno:Number,
	candidate:String,
	adhaar:{type:Number,unique:true},
	created:{type: Date,default: Date.now}
});
UserSchema.plugin(passportLocalmongoose);
module.exports = mongoose.model("User",UserSchema);