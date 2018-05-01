const mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	uniqueValidator = require('mongoose-unique-validator'),
	crypto = require('crypto'),
	jwt = require('jsonwebtoken'),
	secret = require('../config').secret

const UserSchema = new Schema(
	{
		username: {
			type: String,
			lowercase: true,
			unique: true,
			required: [true, "can't be blank"],
			match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
			index: true
		},
		email: {
			type: String,
			lowercase: true,
			unique: true,
			required: [true, "can't be blank"],
			match: [/\S+@\S+\.\S+/, 'is invalid'],
			index: true
		},
		bio: String,
		image: String,
		favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
		following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		hash: String,
		salt: String
	},
	{ timestamps: true }
)

UserSchema.plugin(uniqueValidator, { message: 'sorry, already taken' })

UserSchema.methods.validPassword = function(password) {
	const hash = crypto
		.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512')
		.toString('hex')
	return this.hash === hash
}

UserSchema.methods.setPassword = function(password) {
	this.salt = crypto.randomBytes(16).toString('hex')
	this.hash = crypto
		.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512')
		.toString('hex')
}

UserSchema.methods.generateJWT = function() {
	let today = new Date()
	let exp = new Date(today)
	exp.setDate(today.getDate() + 60)

	return jwt.sign(
		{
			id: this._id,
			username: this.username,
			exp: parseInt(exp.getTime() / 1000)
		},
		secret
	)
}

UserSchema.methods.toAuthJSON = function(user) {
	return {
		username: this.username,
		email: this.email,
		token: this.generateJWT(),
		bio: this.bio,
		image: this.image
	}
}

UserSchema.methods.toProfileJSON = function(user) {
	return {
		username: this.username,
		bio: this.bio,
		image:
			this.image ||
			'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjtzcONpGx_gK1jG7NvusIVkHFG76GWyueX3AdpsfKOnHTrxfe',
		following: user ? user.isFollowing(this._id) : false
	}
}

UserSchema.methods.favorite = function(id) {
	if (this.favorites.indexOf(id) === -1) {
		this.favorites.push(id)
	}
	return this.save()
}

UserSchema.methods.unfavorite = function(id) {
	this.favorites.remove(id)
	return this.save()
}

UserSchema.methods.isFavorite = function(id) {
	return this.favorites.some(favId => {
		return favId.toString() === id.toString()
	})
}

UserSchema.methods.follow = function(id) {
	if (this.following.indexOf(id) === -1) {
		this.following.push(id)
	}
	return this.save()
}

UserSchema.methods.unfollow = function(id) {
	this.following.remove(id)
	return this.save()
}

UserSchema.methods.isFollowing = function(id) {
	return this.following.some(followId => {
		return followId.toString() === id.toString()
	})
}

mongoose.model('User', UserSchema)
