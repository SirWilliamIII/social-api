const mongoose        = require('mongoose'),
      Schema          = mongoose.Schema,
      uniqueValidator = require('mongoose-unique-validator'),
      crypto          = require('crypto'),
      jwt             = require('jsonwebtoken'),
      secret          = require('../config').secret


const UserSchema = new Schema({
	username:  {
		type:      String,
		lowercase: true,
		unique:    true,
		required:  [true, "can't be blank"],
		match:     [/^[a-zA-Z0-9]+$/, 'is invalid'],
		index:     true
	},
	email:     {
		type:      String,
		lowercase: true,
		unique:    true,
		required:  [true, "can't be blank"],
		match:     [/\S+@\S+\.\S+/, 'is invalid'],
		index:     true
	},
	bio:       String,
	image:     String,
	hash:      String,
	salt:      String,
	favorites: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Article'
		}
	]

}, { timestamps: true })


UserSchema.plugin(uniqueValidator, { message: 'sorry, already taken' })


UserSchema.methods.setPassword = function (password) {
	this.salt = crypto.randomBytes(16).toString('hex')
	this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex')
}

UserSchema.methods.validPassword = function (password) {
	const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex')
	return this.hash === hash
}

UserSchema.methods.generateJWT = function () {
	const today = new Date()
	let exp = new Date(today)
	exp.setDate(today.getDate() + 60)

	return jwt.sign({
		id:       this._id,
		username: this.username,
		exp:      parseInt(exp.getTime() / 1000)
	}, secret)
}

UserSchema.methods.toAuthJSON = function () {
	return {
		username: this.username,
		email:    this.email,
		token:    this.generateJWT(),
		bio:      this.bio,
		image:    this.image
	}
}

UserSchema.methods.toProfileJSON = user => {
	return {
		username:  this.username,
		bio:       this.bio,
		image:     this.image || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjtzcONpGx_gK1jG7NvusIVkHFG76GWyueX3AdpsfKOnHTrxfe',
		following: false
	}
}

UserSchema.methods.favorite = id => {
	if(this.favorites.indexOf(id) === -1) {
		this.favorites.push(id)
	}
	return this.save()
}

UserSchema.methods.unfavorite = id => {
	this.favorites.remove(id)
	return this.save()
}

UserSchema.methods.isFavorite = id => {
	return this.favorites.some(favId => {
		return favId.toString() === id.toString()
	})
}

mongoose.model('User', UserSchema)
