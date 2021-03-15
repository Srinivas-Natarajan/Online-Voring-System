var express = require('express');
var app = express();
var session = require('express-session'); 
var passport = require('passport');
var LocalStrategy = require('passport-local');
var mongo = require('mongodb');
var bodyParser=require('body-parser');
var flash = require('connect-flash');
var mongoose=require('mongoose');
var shortID=require('short-mongo-id');
var methodOverride=require("method-override");
var passportLocalMongoose = require("passport-local-mongoose");
var User=require("./public/schema/userschema");
var	expressSanitizer = require('express-sanitizer');
var	cookieParser = require('cookie-parser')
var crypto = require('crypto');
	

var AdminSchema = new mongoose.Schema({
	cname:String,
	cage:Number,
	cparty:String,
	cinfo:String,
	cimage:String,
	ccount:{type: Number,default:0},
	created:{type: Date,default: Date.now}
	
});

var admin = mongoose.model("Admin",AdminSchema);

//APP CONFIG
// mongoose.connect("mongodb://localhost/voting");
mongoose.connect('mongodb://localhost:27017/voting', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to DB!'))
.catch(error => console.log(error.message));

app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(cookieParser('secret'));

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Something!!",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next(); 
});

//ROOT ROUTE
app.get("/",function(req,res){
	res.render("home");
});


//ADD new candidates
app.get("/admin/new",function(req,res){
	res.render("add");
});

//ADMIN PAGE
app.get("/admin",function(req,res){
	res.render("admin");
});

//Create
app.post("/admin",function(req,res){
	admin.create(req.body.admin,function(err,newCandidate){
	    if(err){
		    res.render("add");}
		else{
			res.redirect("/admin");
		}	
	});
});

//VOTER INDEX
app.get("/indexvoter",function(req,res){
	User.find({},function(err,voterindex){
		if(err){
			console.log("Error!");
		}else{
			res.render("voterindex",{voters:voterindex});
		}
	});
});

//VOTER EDITING AND ENCRYPTING route
app.get("/voterindex/:id/edit",function(req,res){
	User.findById(req.params.id,function(err,Voters){
		if(err){
			res.redirect("/admin");
		}else{
			res.render("editvoter",{voter: Voters});
		}
	});
});


//UPDATE ROUTE
app.put("/voterindex/:id",function(req,res){
	User.findByIdAndUpdate(req.params.id,req.body.voter,function(err,updatedVoter){
		if(err){
			res.redirect("/admin");
		}else{
			res.redirect("/indexvoter");
		}
	});
});


//DELETE VOTER 
app.delete("/voterindex/:id",function(req,res){
	User.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/indexvoter");
		}else{
			res.redirect("/indexvoter");
		}
	});
});



//Vote Count
app.get("/votecount",function(req,res){
	admin.find({},function(err,candidates){
		if(err){
			console.log(err);
		}else{
			console.log(candidates);
			res.render("votecount",{candidates:candidates});
		}
	});
});


//vote route
app.get("/vote",function(req,res){
	admin.find({},function(err,candidate){
		if(err){
			console.log("Error!");
		}else{
			res.render("votepage",{candidates:candidate});
			console.log(candidate);
		}
	});
});


app.get("/candidate/:id",function(req,res){
	admin.findById(req.params.id,function(err,candidates){
		if(err){
			console.log("Error!");
		}else{
			res.render("confirmcan",{candidate:candidates});
		}
	});
});


//VOTING LOGIC
app.post("/voter/:id",function(req,res){
	User.findById(req.user._id,function(err,user){
		if(err){
			console.log(err);
		}else{
			admin.findById(req.params.id,function(err,foundcandidate){
				if(err){
					res.render("votepage");
				}else {
					if(user.candidate!=undefined){
						res.render("warningage");
					}else{
						console.log("posted!!");
						console.log(user);
						console.log(foundcandidate);
						console.log("done!");
						user.candidate=foundcandidate.cname;
						user.save();
						foundcandidate.ccount+=1;
						foundcandidate.save(function(err){
							if(err){
								console.log(err);
							}
						})
						res.render("successage",{candidate:foundcandidate});
					}
				}
			});
		}
	});
});
		
		
	


//ADMIN LOGIN
app.get("/login/admin",function(req,res){
	res.render("adminlogin");
});

app.post("/login/admin",function(req,res){
	if(req.body.username=="Srinivas" && req.body.password=="Password123"){
		res.redirect("/admin");
	}else{
		res.redirect("/login/admin");
	}
});








//VOTER REGISTRATION
app.get("/register",function(req,res){ 
	res.render("register");
});
	
app.post("/register",function(req,res){ 
	var base = req.body.email + req.body.adhaar;
	var code = crypto.createHash('md5').update(base).digest('hex');
	var aadh = parseInt(req.body.adhaar, 10);
	User.register(
			new User({
			username:req.body.username,
			email:req.body.email,
			uniqueCode: code,
			phoneno:req.body.phoneno,
			adhaar:aadh,
		}),
		req.body.password, function(err,user){ 
				if(err){
					console.log(err);
					return res.render("register"); 
				}
			passport.authenticate("local")(req,res,function(){ 
				res.redirect("/");
			});
		}
	); 
});


//VOTER LOGIN
app.get("/login",function(req,res){
	res.render("login");
});
app.post("/login",passport.authenticate("local",{
	successRedirect:"/vote",
	failureRedirect:"/login"
})	,function(req,res){});


	
//app.post("/login",function(req,res){
//	if(req.body.username=="shaswat" && req.body.password==123){
//		res.render("admin");
//	}
//	else{
//		res.render("login");
//	}
//  });




//LOGOUT
app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/");
});
	
app.listen(3000 || port.env.IP,function(){
	console.log("Server has started");
});

