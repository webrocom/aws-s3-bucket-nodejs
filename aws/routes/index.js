var express = require('express');
var router = express.Router();
var fs = require('fs');
var Datastore = require('nedb');
var db = new Datastore({ filename: 'db/poster', autoload: true });
var multer  = require('multer');
var aws = require('aws-sdk');

// https://github.com/louischatriot/nedb

/* Multer set storage location*/
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/')
  },
  filename: function (req, file, cb) {
  	  var str = file.originalname;
  	  str = str.replace(/\s+/g, '-').toLowerCase();
  	  global.poster = Date.now() + '_' + str;
  	  cb(null, poster);
  }
});

var upload = multer({ storage: storage });
aws.config.update({ accessKeyId: 'AKIAJ2YJPH3AOWOYSLCA', secretAccessKey: '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' });
aws.config.update({region: 'us-west-2'});
// dev.sociogators.files

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/upload', function(req, res, next) {
    db.find({}, function (err, img) {
  		res.render('upload', {images:img});
    }); 	
});


router.post('/upload', upload.single('image'),   function(req, res, next) {
	var s3 = new aws.S3();
	s3.upload({
			  "Bucket": "dev.sociogators.files",
			   "Key": poster,
			   "Body": req.file.path
			}, function(err, data) {
			if (err) {
	      		console.log("Error uploading data: ", err);
	    	} else {
	    			//delete local file
	    			fs.unlinkSync(req.file.path);
		      		console.log(data);


		      		//save image name to database
		      		var img = { link: data['Location'], 
		      					name: req.file.originalname,
		      					diskname: req.file.filename,
		      					created:  Date.now()
           			};
           			db.insert(img, function (err, newDoc) {   
       					// Callback is optional
  						// newDoc is the newly inserted document, including its _id
  						// newDoc has no key called notToBeSaved since its value was undefined
					});
	    	}
		});

   res.redirect('/upload');
  
});


router.post('/download', function(req, res, next){
	var s3 = new aws.S3();
	// console.log(req.body.diskname);

	var params = {Bucket: 'dev.sociogators.files', Key: req.body.diskname};

	// console.log(params);
	// res.attachment(req.body.diskname);
	s3.getObject(params,
	  function (error, data) {
	    if (error != null) {
	      console.log("Failed to retrieve an object: " + error);
	    } else {
	      console.log("Loaded " + data.ContentLength + " bytes");
	      // do something with data.body
	    }
	  }
	);
	
	// var file = fs.createWriteStream('/public/images/'+req.body.diskname+'');
	// s3.getObject(params).createReadStream().pipe(file);

	res.redirect('/upload');

});


module.exports = router;
