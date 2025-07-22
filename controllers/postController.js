const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Favorite = require('../models/Favorite');

async function createPost(req, res) {
  try {
    const { content } = req.body;

    if (!content) return res.status(400).json({ message: 'Content is required' });

    const newPost = new Post({
      author: req.user.id,
      content
    });

    await newPost.save();
    res.status(201).json({ message: 'Post created', post: newPost });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getTimeline(req, res) {
  try {
    const posts = await Post.find({})
      .select('_id author content createdAt')
      .sort({ createdAt: -1 })
      .populate('author', 'username');

    res.status(200).json(posts);
  } catch (err) {
    console.error('Get timeline error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getPostById(req, res) {
  try {
    console.log('get post by id trig');
    const id = req.params.id;

    const post = await Post.findById(id)
      .select('_id author content createdAt')
      .populate('author', 'username');

    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.status(200).json(post);
  } catch (err) {
    console.error('Get post by ID error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function LikeUnlikePost(req, res) {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const existingLike = await Like.findOne({ user: userId, post: postId });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      return res.status(200).json({ message: "Post unliked" });
    } else {
      await Like.create({ user: userId, post: postId });
      return res.status(200).json({ message: "Post liked" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}


async function addComment(req, res) {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;
    const { text } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await Comment.create({
      post: postId,
      author: userId,
      text
    });

    res.status(201).json({ message: "Comment added", commentId: comment._id });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
}

async function getUsersWhoLiked(req, res) {
  try {
    const postId = req.params.postId;

    const likes = await Like.find({ postId }).populate('userId', 'username');
    const usernames = likes.map(like => like.userId.username);

    res.status(200).json({ likedBy: usernames });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

async function getComments(req, res) {
  try {
    const postId = req.params.postId;

    const comments = await Comment.find({ post: postId })
      .populate('author', 'username')
      .sort({ createdAt: -1 });

    const commentData = comments.map(comment => ({
      username: comment.author.username,
      text: comment.text,
      date: comment.createdAt
    }));

    res.status(200).json({ comments: commentData });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}



// async function getAllPostsWithStatus(req, res) {
//   try {
//     console.log("getAllPostsWithLikeStatus triggered");
//     const userId = req.user.id;
//     const user = await User.findById(userId).select('favorites');
//     const posts = await Post.find()
//       .populate('author', 'username -_id')
      
//     const updatedPosts = posts.map(post => {
//       return {
//         postId:post._id,
//         content:post.content,
//         author:post.author,
//         isLiked: post.likes.some(likeId => likeId.toString() === userId),
//         isFavorited: user.favorites.some(favId => favId.toString() === post._id.toString())
//       };
//     });

//     res.status(200).json({ posts: updatedPosts });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// }

async function getAllPostsWithStatus(req, res) {
  try {
    const userId = req.user.id;

    // Fetch all posts (without populating likes/comments)
    const posts = await Post.find().populate('author', 'username');

    // Fetch liked post IDs for this user
    const userLikes = await Like.find({ user: userId }).select('post');
    const likedPostIds = userLikes.map(like => String(like.post));

    // Fetch favorited post IDs for this user
    const userFavorites = await Favorite.find({ user: userId }).select('post');
    const favoritedPostIds = userFavorites.map(fav => String(fav.post));

    const result = posts.map(post => {
      const postIdStr = String(post._id);
      return {
        postId: post._id,
        content: post.content,
        author: post.author.username,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        isLiked: likedPostIds.includes(postIdStr),
        isFavorited: favoritedPostIds.includes(postIdStr)
      };
    });

    return res.status(200).json({ posts: result });
  } catch (error) {
    console.error('Error in getAllPostsWithStatus:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


module.exports={
    createPost,
    getTimeline,
    getPostById,
    addComment,
    LikeUnlikePost,
    getUsersWhoLiked,
    getComments,
    getAllPostsWithStatus

}