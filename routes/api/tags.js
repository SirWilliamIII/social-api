const express = require('express'),
      router = express.Router(),
      mongoose = require('mongoose'),
      Article = mongoose.model('Article')


router.get('/', (req, res, next) => {
	Article.find().distinct('tagList')
		.then(tags => {
			return res.json({ tags })
		})
		.catch(next)
})


module.exports = router
