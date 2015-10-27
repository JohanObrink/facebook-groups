var EventEmitter = require('events').EventEmitter,
  request = require('request');

function Feed(groupId, accessToken) {
  this.groupId = groupId;
  this.accessToken = accessToken;

  this.posts = [];
  this.comments = [];

  this.onPosts = this.onPosts.bind(this);
}

Feed.prototype = Object.create(EventEmitter.prototype);
Feed.prototype.constructor = Feed;

Feed.prototype.read = function () {
  var url = [
    'https://graph.facebook.com/',
    this.groupId,
    '/feed?access_token=',
    this.accessToken
  ].join('');
  request(url, this.onPosts);
  return this;
};

Feed.prototype.onPosts = function (error, response, body) {
  var self = this;
  if(error) {

  } else {
    this.posts = this.posts.concat(body.data);
    body.data.forEach(function (post) {
      if(post.comments && post.comments.data && post.comments.data instanceof Array) {
        self.comments = self
          .comments
          .concat(post
            .comments
            .data
            .map(function (comment) {
              comment.postId = post.id;
              return comment;
            }));
      }
    });
    this.emit('posts', body.data);
    if(body.paging.next) {
      request(body.paging.next, this.onPosts);
    } else {
      this.emit('end-posts');
      this.loadComments(this.posts);
    }
  }
};

Feed.prototype.loadComments = function (posts) {
  var post = posts[0];
  var url = [
    'https://graph.facebook.com/',
    post.id,
    '/comments?access_token=',
    this.accessToken
  ].join('');
  request(url, this.onComments.bind(this, post.id));
};

Feed.prototype.onComments = function (postId, error, response, body) {
  if(!error) {
    this.comments = this
      .comments
      .concat(body.data.map(function (comment) {
        comment.postId = postId;
        return comment;
      }));
  }
};

Feed.prototype.onLikes = function (error, response, body) {

};

module.exports = Feed;