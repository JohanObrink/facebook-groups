var chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon'),
  proxyquire = require('proxyquire');

chai.use(require('sinon-chai'));

describe('feed', function () {
  var feed, request, groupId, accessToken;
  beforeEach(function () {
    request = sinon.stub();
    var Feed = proxyquire(process.cwd() + '/lib/feed', {
      'request': request
    });
    groupId = '12345';
    accessToken = 'abcdef';
    feed = new Feed(groupId, accessToken);
  });
  it('calls GET on the correct URL', function () {
    feed.read();

    var expectedUrl = 'https://graph.facebook.com/12345/feed?access_token=abcdef';
    expect(request).calledOnce.calledWith(expectedUrl);
  });
  it('emits a feed event every time posts have been retrieved', function () {
    var listener = sinon.spy();
    feed.on('posts', listener);
    var body = {
      data: [{id: '1_1'}],
      paging: {}
    };

    feed.read();
    request.firstCall.yield(null, {}, body);

    expect(listener).calledOnce.calledWith(body.data);
  });
  it('stores all posts', function () {
    var body = {
      data: [{id: '1_1'}],
      paging: {}
    };

    feed.read();
    request.firstCall.yield(null, {}, body);

    expect(feed.posts).to.eql([{id: '1_1'}]);
  });
  it.only('stores the comments of all posts', function () {
    var body = {
      data: [{
        id: '1_1',
        comments: {
          data: [{id:'111'}, {id:'112'}]
        }
      },{
        id: '1_2',
        comments: {
          data: [{id:'211'}, {id:'212'}]
        }
      }],
      paging: {}
    };

    feed.read();
    request.firstCall.yield(null, {}, body);

    expect(feed.comments).to.eql([{
      id: '111',
      postId: '1_1'
    }, {
      id: '112',
      postId: '1_1'
    }, {
      id: '211',
      postId: '1_2'
    }, {
      id: '212',
      postId: '1_2'
    }]);
  });
  it('issues a call for the next set of posts', function () {
    var nextLink = 'https://graph.facebook.com/12345/feed?access_token=abcdef&offset=10';
    var body = {
      data: [{id: '1_1'}],
      paging: {
        next: nextLink
      }
    };

    feed.read();
    request.firstCall.yield(null, {}, body);

    expect(request).calledTwice;
    expect(request.secondCall).calledWith(nextLink);
  });
  it('appends the next set of posts', function () {
    var nextLink = 'https://graph.facebook.com/12345/feed?access_token=abcdef&offset=10';
    var body1 = {
      data: [{id: '1_1'}],
      paging: {
        next: nextLink
      }
    };
    var body2 = {
      data: [{id: '1_2'}],
      paging: {}
    };

    feed.read();
    request.firstCall.yield(null, {}, body1);
    request.firstCall.yield(null, {}, body2);

    expect(feed.posts).to.eql([{id: '1_1'}, {id: '1_2'}]);
  });
  it('emits end-posts if no next link is present', function () {
    var listener = sinon.spy();
    feed.on('end-posts', listener);
    var body = {
      data: [{id: '1_1'}],
      paging: {}
    };

    feed.read();
    request.firstCall.yield(null, {}, body);

    expect(listener).calledOnce;
  });
  xdescribe('when posts are done', function () {
    beforeEach(function () {
      feed.read();
      var body1 = {
        data: [{id: '1_1'}],
        paging: {
          next: 'https://next'
        }
      };
      var body2 = {
        data: [{id: '1_2'}],
        paging: {}
      };
      request.firstCall.yield(null, {}, body1);
      request.secondCall.yield(null, {}, body2);
    })
    it('starts loading comments when posts is done', function () {
      expect(request).calledThrice;
      var expectedUrl = 'https://graph.facebook.com/1_1/comments?access_token=abcdef';
      expect(request.thirdCall).calledWith(expectedUrl);
    });
    it('it stores comments when done', function () {
      request.thirdCall.yield(null, {}, {
        data: [{id: '111'}],
        paging: {}
      });
      expect(feed.comments).to.eql([{id: '111', postId: '1_1'}]);
    });
    it('starts loading next page of comments when first is done', function () {
      request.thirdCall.yield(null, {}, {
        data: [{id: '111'}],
        paging: {next: 'http://nextComments'}
      });
      expect(request.callCount).to.equal(4);
      expect(request.calls[3]).calledWith('http://nextComments');
    });
  });
});