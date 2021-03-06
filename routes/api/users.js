const mongoose = require('mongoose'),
	router = require('express').Router(),
	passport = require('passport'),
	User = mongoose.model('User'),
	auth = require('../auth')

router.get('/user', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			if (!user) {
				return res.status(401).send()
			}
			return res.json({
				user: user.toAuthJSON()
			})
		})
		.catch(next)
})

// //  @/api/users
router.get('/users', (req, res) => {
	User.find().then(users => {
		res.send({ users })
	})
})

router.put('/user', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			if (!user) {
				return res.status(401).send()
			}
			if (typeof req.body.user.username !== 'undefined') {
				user.username = req.body.user.username
			}
			if (typeof req.body.user.email !== 'undefined') {
				user.email = req.body.user.email
			}
			if (typeof req.body.user.bio !== 'undefined') {
				user.bio = req.body.user.bio
			}
			if (typeof req.body.user.image !== 'undefined') {
				user.image = req.body.user.image
			}
			if (typeof req.body.user.password !== 'undefined') {
				user.setPassword(req.body.user.password)
			}

			return user.save().then(() => {
				return res.json({ user: user.toAuthJSON() })
			})
		})
		.catch(next)
})

router.post('/users/login', (req, res, next) => {
	if (!req.body.user.email) {
		return res.status(422).json({
			errors: { email: "can't be blank" }
		})
	}

	if (!req.body.user.password) {
		return res.status(422).json({
			errors: { password: "can't be blank" }
		})
	}

	passport.authenticate('local', { session: false }, function(
		err,
		user,
		info
	) {
		if (err) {
			return next(err)
		}
		if (user) {
			user.token = user.generateJWT()
			return res.json({ user: user.toAuthJSON() })
		} else {
			return res.status(422).json(info)
		}
	})(req, res, next)
})

router.post('/users', (req, res, next) => {
	let user = new User()

	user.username = req.body.user.username
	user.email = req.body.user.email
	user.setPassword(req.body.user.password)

	user
		.save()
		.then(() => {
			return res.json({ user: user.toAuthJSON() })
		})
		.catch(next)
})

module.exports = router
