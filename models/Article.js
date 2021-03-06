const mongoose        = require('mongoose'),
      Schema          = mongoose.Schema,
      uniqueValidator = require('mongoose-unique-validator'),
      slug            = require('slug'),
      User            = mongoose.model('User')


const ArticleSchema = new Schema({
	slug:           {
		type:      String,
		lowercase: true,
		unique:    true
	},
	title:          String,
	description:    String,
	body:           String,
	favoritesCount: { type: Number, default: 0 },
	tagList:        [{ type: String }],
	author:         { type: Schema.Types.ObjectId, ref: 'User' },
	comments:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
}, { timestamps: true })

ArticleSchema.plugin(uniqueValidator, { message: 'is already taken' })

ArticleSchema.pre('validate', next => {
	this.slugify()
	next()
})

ArticleSchema.methods.slugify = () => {
	this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36)
}

ArticleSchema.methods.updateFavoriteCount = () => {
	const article = this
	return User.count({ favorites: { $in: [article._id] } })
		.then(count => {
			article.favoritesCount = count
			return article.save()
		})
}

ArticleSchema.methods.toArticleJSON = user => {
	return {
		slug:           this.slug,
		title:          this.title,
		description:    this.description,
		body:           this.body,
		createdAt:      this.createdAt,
		updatedAt:      this.updatedAt,
		tagList:        this.tagList,
		favoritesCount: this.favoritesCount,
		favorited:      user ? user.isFavorite(this._id) : false,
		author:         this.author.toProfileJSON(user)
	}
}

module.exports = mongoose.model('Article', ArticleSchema)
