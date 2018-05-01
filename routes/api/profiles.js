const mongoose = require('mongoose'),
      express  = require('express'),
      router   = express.Router(),
      User     = mongoose.model('User'),
      auth     = require('../auth')


router.param('username', (req, res, next, username) => {
	User.findOne({
		username
	})
		.then(user => {
			if(!user) {
				return res.status(404).send()
			}
			req.profile = user
			return next()
		})
		.catch(next)
})

router.get('/:username', auth.optional, (req, res, next) => {
	if(req.payload) {
		User.findById(req.payload.id)
			.then(user => {
				if(!user) {
					return res.json({ profile: req.profile.toProfileJSON(false) })
				}
				return res.json({ profile: req.profile.toProfileJSON(user) })
			})
	} else {
		return res.json({ profile: req.profile.toProfileJSON() })
	}
})

//  endpoint for following another user
router.post('/:username/follow', auth.required, (req, res, next) => {
	const profileId = req.profile._id
	User.findById(req.payload.id)
		.then(user => {
			if(!user) {
				return res.status(401).send()
			}
			return user.follow(profileId)
				.then(() => {
					return res.json({ profile: req.profile.toProfileJSON(user)})
				})
		})
		.catch(next)
})

// to unfollow another user
router.delete('/:username/follow', auth.required, (req, res, next) => {
	const profileId = req.profile._id
	User.findById(req.payload.id)
		.then(user => {
			if(!user) {
				return res.status(401).send()
			}
			return user.unfollow(profileId)
				.then(() => {
					return res.json({profile: req.profile.toProfileJSON(user)})
				})
		})
		.catch(next)
})


module.exports = router
