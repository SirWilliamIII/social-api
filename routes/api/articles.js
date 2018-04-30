const router   = require('express').Router(),
      passport = require('passport'),
      mongoose = require('mongoose'),
      Article  = mongoose.model('Article'),
      User     = mongoose.model('User'),
      Comment = mongoose.model('Comment'),
      auth     = require('../auth')


router.post('/', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			if(!user) {
				return res.status(401).send()
			}
			const article = new Article(req.body.article)
			article.author = user

			return article.save()
				.then(() => {
					console.log(article.author)
					return res.json({
						article: article.toArticleJSON(user)
					})
				})
		})
		.catch(next)
})

router.post('/:article/favorite', auth.required, (req, res, next) => {
	const articleId = req.article._id
	User.findById(req.payload.id)
		.then(user => {
			if(!user) {
				return res.status(401).send()
			}
			return user.favorite(articleId)
				.then(() => {
					return req.article.updateFavoriteCount()
						.then(article => {
							return res.json({ article: article.toArticleJSON(user) })
						})
				})
		})
		.catch(next)
})

router.param('article', (req, res, next, slug) => {
	Article.findOne({ slug: slug })
		.populate('author')
		.then(article => {
			if(!article) {
				return res.status(404).send()
			}
			req.article = article
			return next()
		})
		.catch(next)
})

router.get('/:article', auth.optional, (req, res, next) => {
	Promise.all([
		req.payload ? User.findById(req.payload.id) : null,
		req.article.populate('author').execPopulate()
	])
		.then(results => {
			const user = results[0]
			return res.json({
				article: req.article.toArticleJSON(user)
			})
		})
		.catch(next)
})

router.put('/:article', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			if(req.article.author._id.toString() === req.payload.id.toString()) {
				if(typeof req.body.article.title !== 'undefined') {
					req.article.title = req.body.article.title
				}
				if(typeof req.body.article.description !== 'undefined') {
					req.article.description = req.body.article.description
				}
				if(typeof req.body.article.body !== 'undefined') {
					req.article.body = req.body.article.body
				}
				req.article.save()
					.then(article => {
						return res.json({
							article: article.toJSON(user)
						})
					})
					.catch(next)
			} else {
				return res.status(403).send()
			}
		})
})

router.delete('/:article', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(() => {
			if(req.article.author._id.toString() === req.payload.id.toString()) {
				return req.article.remove()
					.then(() => {
						return res.sendStatus(204)
					})
			} else {
				return res.sendStatus(403)
			}
		})
})

router.delete('/:article/favorite', auth.required, (req, res, next) => {
	const articleId = req.article._id
	User.findById(req.payload.id)
		.then(user => {
			if(!user) {
				return res.status(401).send()
			}
			return user.unfavorite(articleId)
				.then(() => {
					return req.article.updateFavoriteCount()
						.then(article => {
							return res.json({ article: article.toArticleJSON(user) })
						})
				})
		})
		.catch(next)
})


//  create comments on articles
router.post('/:article/comments', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			if(!user) {
				return res.status(401).send()
			}
			const comment = new Comment(req.body.comment)
			comment.article = req.article
			comment.author = user

			return comment.save()
				.then(() => {
					req.article.comments.push(comment)
					return req.article.save()
						.then(article => {
							res.json({
								comment: comment.toCommentJSON(user)
							})
						})
				})
		})
})

//  list comments on articles
router.get('/:article/comments', auth.optional, (req, res, next) => {
	Promise.resolve(req.payload ? User.findById(req.payload.id) : null)
		.then(user => {
			return req.article.populate({
				path:     'comments',
				populate: {
					path: 'author'
				},
				options:  {
					sort: {
						createdAt: 'desc'
					}
				}
			})
			.execPopulate()
				.then(article => {
					return res.json({
						comments: req.article.comments.map(comment => {
							return comment.toCommentJSON(user)
						})
					})
				})
		})
		.catch(next)
})

//   router param middleware for resolving  /:comment in URL

router.param('comment', (req, res, next, id) => {
	Comment.findById(id)
		.then(comment => {
			if(!comment) {
				return res.status(404).send()
			}
			req.comment = comment
			return next()
		})
		.catch(next)
})

router.delete('/:article/comments/:comment', auth.required, (req, res, next) => {
	if(req.comment.author.toString() === req.payload.id.toString()) {
		req.article.comments.remove(req.comment._id)
		req.article.save()
			.then(Comment.find({ _id: req.comment._id}).remove().exec())
			.then(() => {
				res.status(204).send()
			})
	} else {
		res.status(403).send()
	}
})


module.exports = router
