const router = require('express').Router()

const users = require('./users')
const profiles = require('./profiles')
const articles = require('./articles')

router.use('/', users)
router.use('/profiles', profiles)
router.use('/articles', articles)

router.use((err, req, res, next) => {
	if(err.name === 'ValidationError') {
		return res.status(422).json({
			errors: Object.keys(err.errors).reduce((error, key) => {
				errors[key] = err.errors[key].message
				return errors
			}, {})
		})
	}
	return next(err)
})

module.exports = router;
