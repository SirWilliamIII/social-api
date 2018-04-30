const fs           = require('fs'),
    http         = require('http'),
    path         = require('path'),
    methods      = require('methods'),
    express      = require('express'),
    bodyParser   = require('body-parser'),
    logger = require('morgan'),
    override = require('method-override'),
    session      = require('express-session'),
    cors         = require('cors'),
    passport     = require('passport'),
    errorhandler = require('errorhandler'),
    mongoose     = require('mongoose')


const isProduction = process.env.NODE_ENV === 'production'

const app = express(),
      port = process.env.PORT || 8000

app.use(cors())

app.use(logger('dev'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(override())
app.use(express.static(__dirname + '/public'))

app.use(session({ secret: 'will', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }))

if(!isProduction) {
	app.use(errorhandler())
}

if(isProduction) {
	mongoose.connect(process.env.MONGODB_URI)
} else {
	mongoose.connect('mongodb://localhost:27017/social-api')
	mongoose.set('debug', true)
}

require('./models/User')
require('./models/Article')
require('./models/Comment')
require('./config/passport')


app.use(require('./routes'))


app.use((req, res, next) => {
	const err = new Error('Not Found')
	err.status = 404
	next(err)
})


if(!isProduction) {
	app.use((err, req, res, next) => {
		console.log(err.stack)
		res.status(err.status || 500)
		res.json({
			'errors': {
				message: err.message,
				error:   err
			}
		})
	})
}

app.use((err, req, res, next) => {
	res.status(err.status || 500)
	res.json({
		'errors': {
			message: err.message,
			error:   {}
		}
	})
})

const server = app.listen(port, () => {
	console.log(`Listening on port ${port}`)
})
