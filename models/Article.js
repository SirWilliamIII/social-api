const mongoose = require('mongoose'),
      Schema = mongoose.Schema,
      uniqueValidator = require('mongoose-unique-validator'),
      slug = require('slug')


const ArticleSchema = Schema({
	slug: {
		type: String,
		lowercase: true,
		unique: true
	},
	title: String,
	description: String,
	body: String,
	favoritesCount: {
		type: Number,
		default: 0
	},
	tagList: [{ type: String }],
	author: {
		type: Schema.Types.ObjectId, ref: 'User'
	}
}, { timestamps: true })


ArticleSchema.plugin(uniqueValidator, {
	message: 'is already taken'
})

ArticleSchema.methods.slugify = () => {
	this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36)
}

ArticleSchema.pre('validate', next => {
	if(!this.slug) {
		this.slugify()
	}
	next()
})

ArticleSchema.methods.toJSON = user => {
	return {
		slug: this.slug,
		title: this.title,
		description: this.description,
		body: this.body,
		createdAt: this.createdAt,
		updatedAt: this.updatedAt,
		tagList: this.tagList,
		favoritesCount: this.favoritesCount,
		author: this.author.toProfileJSON(user)
	}
}

mongoose.model('Article', ArticleSchema)
