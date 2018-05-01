const express = require('express'),
	router = express.Router(),
	passport = require('passport'),
	mongoose = require('mongoose'),
	Article = mongoose.model('Article'),
	User = mongoose.model('User'),
	Comment = mongoose.model('Comment'),
	auth = require('../auth')

router.param('article', (req, res, next, slug) => {
	Article.findOne({ slug })
		.populate('author')
		.then(article => {
			if (!article) {
				return res.status(404).send()
			}
			req.article = article
			return next()
		})
		.catch(next)
})

//   router param middleware for resolving  /:comment in URL
router.param('comment', (req, res, next, id) => {
	Comment.findById(id)
		.then(comment => {
			if (!comment) {
				return res.status(404).send()
			}
			req.comment = comment
			return next()
		})
		.catch(next)
})

router.post('/', auth.required, (req, res, next) => {
	User.findById(req.payload.id)
		.then(user => {
			if (!user) {
				return res.status(401).send()
			}
			const article = new Article(req.body.article)
			article.author = user

			return article.save().then(() => {
				console.log(article.author)
				return res.json({
					article: article.toArticleJSON(user)
				})
			})
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
	User.findById(req.payload.id).then(user => {
		if (req.article.author._id.toString() === req.payload.id.toString()) {
			if (typeof req.body.article.title !== 'undefined') {
				req.article.title = req.body.article.title
			}
			if (typeof req.body.article.description !== 'undefined') {
				req.article.description = req.body.article.description
			}
			if (typeof req.body.article.body !== 'undefined') {
				req.article.body = req.body.article.body
			}
			req.article
				.save()
				.then(article => {
					return res.json({
						article: article.toArticleJSON(user)
					})
				})
				.catch(next)
		} else {
			return res.status(403).send()
		}
	})
})

router.delete('/:article', auth.required, (req, res, next) => {
	User.findById(req.payload.id).then(() => {
		if (req.article.author._id.toString() === req.payload.id.toString()) {
			return req.article.remove().then(() => {
				return res.sendStatus(204)
			})
		} else {
			return res.sendStatus(403)
		}
	})
})

router.post('/:article/favorite', auth.required, (req, res, next) => {
	const articleId = req.article._id
	User.findById(req.payload.id)
		.then(user => {
			if (!user) {
				return res.status(401).send()
			}
			return user.favorite(articleId).then(() => {
				return req.article.updateFavoriteCount().then(article => {
					return res.json({ article: article.toArticleJSON(user) })
				})
			})
		})
		.catch(next)
})

router.delete('/:article/favorite', auth.required, (req, res, next) => {
	const articleId = req.article._id
	User.findById(req.payload.id)
		.then(user => {
			if (!user) {
				return res.status(401).send()
			}
			return user.unfavorite(articleId).then(() => {
				return req.article.updateFavoriteCount().then(article => {
					return res.json({ article: article.toArticleJSON(user) })
				})
			})
		})
		.catch(next)
})

//  list comments on articles
router.get('/:article/comments', auth.optional, (req, res, next) => {
	Promise.resolve(req.payload ? User.findById(req.payload.id) : null)
		.then(user => {
			return req.article
				.populate({
					path: 'comments',
					populate: {
						path: 'author'
					},
					options: {
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

//  create comments on articles
router.post('/:article/comments', auth.required, (req, res, next) => {
	User.findById(req.payload.id).then(user => {
		if (!user) {
			return res.status(401).send()
		}
		const comment = new Comment(req.body.comment)
		comment.article = req.article
		comment.author = user

		return comment.save().then(() => {
			req.article.comments.push(comment)
			return req.article.save().then(article => {
				res.json({
					comment: comment.toCommentJSON(user)
				})
			})
		})
	})
})

router.delete(
	'/:article/comments/:comment',
	auth.required,
	(req, res, next) => {
		if (req.comment.author.toString() === req.payload.id.toString()) {
			req.article.comments.remove(req.comment._id)
			req.article
				.save()
				.then(
					Comment.find({ _id: req.comment._id })
						.remove()
						.exec()
				)
				.then(() => {
					res.status(204).send()
				})
		} else {
			res.status(403).send()
		}
	}
)

// router.get('/', auth.optional, (req, res, next) => {
// 	const query = {}
//
// 	let limit  = 20,
// 	    offset = 0
//
// 	if(typeof req.query.limit !== 'undefined') {
// 		limit = req.query.limit
// 	}
//
// 	if(typeof req.query.offset !== 'undefined') {
// 		offset = req.query.offset
// 	}
//
// 	if(typeof req.query.tag !== 'undefined') {
// 		query.tagList = { "$in": [req.query.tag] }
// 	}
//
// 	Promise.all([
// 		req.query.author ? User.findOne({ username: req.query.author }) : null,
// 		req.query.favorited ? User.findOne({ username: req.query.favorited }) : null
// 	])
// 		.then(results => {
// 			const author    = results[0],
// 			      favoriter = results[1]
//
// 			if(author) {
// 				query.author = author._id
// 			}
//
// 			if(favoriter) {
// 				query._id = { $in: favoriter.favorites }
// 			} else if(req.query.favorited) {
// 				query._id = { $in: [] }
// 			}
// 		})
//
// 	return Promise.all([
// 		Article.find(query)
// 			.limit(Number(limit))
// 			.skip(Number(offset))
// 			.sort({ createdAt: 'desc' })
// 			.populate('author')
// 			.exec(),
// 		Article.count(query).exec(), req.payload ? User.findById(req.payload.id) : null
// 	])
// 		.then(results => {
// 			const articles = results[0]
// 			const articlesCount = results[1]
// 			const user = results[2]
//
// 			return res.json({
// 				articles: articles.map(article => {
// 					return article.toArticleJSON(user)
// 				}),
// 				articlesCount
// 			})
// 		})
// 		.catch(next)
// })
//
// router.get('/feed', auth.required, (req, res, next) => {
// 	let limit  = 20,
// 	    offset = 0
//
// 	if(typeof req.query.limit !== 'undefined') {
// 		limit = req.query.limit
// 	}
//
// 	if(typeof req.query.offset !== 'undefined') {
// 		offset = req.query.offset
// 	}
//
// 	User.findById(req.payload.id)
// 		.then(user => {
// 			if(!user) {
// 				return res.status(401).send()
// 			}
// 			Promise.all([
// 				Article.find({ author: { $in: user.following } })
// 					.limit(Number(limit))
// 					.skip(Number(offset))
// 					.populate('author')
// 					.exec(),
// 				Article.count({ author: { $in: user.following } })
// 			])
// 				.then(results => {
// 					const articles = results[0]
// 					const articlesCount = results[1]
// 					return res.json({
// 						articles: articles.map(article => {
// 							return article.toArticleJSON(user)
// 						}),
// 						articlesCount
// 					})
// 				})
// 				.catch(next)
// 		})
// })

module.exports = router
