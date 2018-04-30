const mongoose = require('mongoose'),
      Schema = mongoose.Schema


const CommentSchema = new Schema({
	body: String,
	author: {
		type: mongoose.Schema.Types.ObjectId, ref: 'User'
	},
	article: {
		type: mongoose.Schema.Types.ObjectId, ref: 'Article'
	}
}, { timestamps: true })

CommentSchema.methods.toCommentJSON = user => {
	return {
		id: this._id,
		body: this.body,
		createdAt: this.createdAt,
		author: this.author.toProfileJSON(user)
	}
}

mongoose.model('Comment', CommentSchema)
