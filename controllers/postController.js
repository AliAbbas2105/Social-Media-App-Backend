const User = require('../models/user')
const Post = require('../models/post')
const Comment = require('../models/comments');
async function createPost (req, res) {
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
};

async function getTimeline (req, res) {
  try {
    const posts = await Post.find({})
      .select('_id author content createdAt') 
      .sort({ createdAt: -1 })               
      .populate('author', 'username');//only getting username from author (User)

    res.status(200).json(posts);
  } catch (err) {
    console.error('Get timeline error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

async function getPostById(req, res) {
  try {
    const { id } = req.params.id;

    const post = await Post.findById(id)
      .select('_id author content createdAt')
      .populate('author', 'username');

    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.status(200).json(post);
  } catch (err) {
    console.error('Get post by ID error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

async function LikeUnlikePost(req, res) {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes.pull(userId); // unlike
    } else {
      post.likes.push(userId); // like
    }

    await post.save();
    res.status(200).json({ message: alreadyLiked ? "Post unliked" : "Post liked" });

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

    post.comments.push(comment._id);
    await post.save();

    res.status(201).json({ message: "Comment added", commentId: comment._id });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
}

async function getUsersWhoLiked(req, res) {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId).populate('likes', 'username');

    if (!post) return res.status(404).json({ message: "Post not found" });

    const usernames = post.likes.map(user => user.username);
    res.status(200).json({ likedBy: usernames });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

async function getComments(req, res) {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId).populate({
      path: 'comments',
      populate: { path: 'author', select: 'username' }
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    const commentData = post.comments.map(comment => ({
      username: comment.author.username,
      text: comment.text,
      date: comment.createdAt
    }));

    res.status(200).json({ comments: commentData });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

module.exports={
    createPost,
    getTimeline,
    getPostById,
    addComment,
    LikeUnlikePost,
    getUsersWhoLiked,
    getComments

}