const jwt = require('jsonwebtoken')
const bcrypt=require('bcrypt')
require('dotenv').config();
const User=require('../models/user')
const Post = require('../models/post')
const Favorite = require('../models/Favorite');
const Like = require('../models/Like')
const Follow = require('../models/Follow');
const { v4: uuidv4 } = require('uuid'); //for generating unique token for sending with link in email
const UserVerificationLink = require('../models/userLinkverification');
const { linkEmailTemplate } = require('../utils/emailTemplates');
const transporter = require('../utils/mailer');

async function Signup(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ error: 'Email already in use' });

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    await UserVerificationLink.deleteMany({ email }); // clear old pending records

    const token = uuidv4(); // unique token
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const pendingUser = new UserVerificationLink({
      name: username,
      email,
      hashedPassword,
      token,
      expiresAt,
      provider: 'custom' // for manual signup
    });

    await pendingUser.save();

    const verificationLink = `${process.env.BASE_URL}/verify-link/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Confirm Your Email',
      html: linkEmailTemplate(verificationLink),
    });

    res.status(200).json({ message: 'Verification link sent. Please confirm your email.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
}

async function Login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'User not found' });

    if (!user.isVerified) return res.status(401).json({ error: 'Email not verified' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid password' });

    user.tokenVersion += 1;
    await user.save();

    const token = jwt.sign(
      { id: user._id, tokenVersion: user.tokenVersion },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
}

async function Logout(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.tokenVersion += 1;
    await user.save();

    res.status(200).json({ message: 'Logged out successfully, token invalidated' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Logout failed' });
  }
};


async function ShowAllUsers(req,res) {
    const users = await User.find().select('-password -__v')
    res.json(users);
}

async function ShowAllUsersWithStats(req, res) {
    try {
        const currentUserId = req.user.id;
        
        // Get all users except current user
        const users = await User.find({ _id: { $ne: currentUserId } })
            .select('-password -__v -tokenVersion');
        
        // Get all follow relationships where current user is the follower
        const followingList = await Follow.find({ follower: currentUserId })
            .select('following');
        
        const followingIds = new Set(
            followingList.map(follow => follow.following.toString())
        );
        
        // Get follow counts for all users in parallel
        const usersWithFollowData = await Promise.all(
            users.map(async (user) => {
                const followersCount = await Follow.countDocuments({ following: user._id });
                const followingCount = await Follow.countDocuments({ follower: user._id });
                
                return {
                    ...user.toObject(),
                    hasFollowed: followingIds.has(user._id.toString()),
                    followersCount,
                    followingCount
                };
            })
        );
        
        res.status(200).json({
            message: 'Users retrieved successfully',
            count: usersWithFollowData.length,
            data: usersWithFollowData
        });
        
    } catch (error) {
        console.error('Show all users error:', error);
        res.status(500).json({ message: 'Failed to retrieve users' });
    }
}

async function addPostToFavorites(req, res) {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const existingFavorite = await Favorite.findOne({ user: userId, post: postId });
    if (existingFavorite) {
      return res.status(400).json({ message: 'Post already in favorites' });
    }

    const newFavorite = new Favorite({ user: userId, post: postId });
    await newFavorite.save();

    return res.status(200).json({ message: 'Post added to favorites' });
  } catch (error) {
    console.error('Add to favorites error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getFavorites(req, res) {
  try {
    const favorites = await Favorite.find({ user: req.user.id })
      .populate({
        path: 'post',
        select: 'content author',
        populate: { path: 'author', select: 'username' }
      });
    
    const favoritePosts = favorites.map(fav => ({
      postId: fav.post._id,
      author: fav.post.author.username,
      content: fav.post.content,
      provider:fav.post.author.provider
    }));
    
    res.status(200).json({ message: 'Your favorite posts are:', data: favoritePosts });
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ message: 'Failed to get favorite posts' });
  }
}

async function getUserProfile(req, res) {
    try {
        const userId = req.params.userId;
        
        const user = await User.findById(userId).select('-password -__v -tokenVersion');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get follow counts
        const followersCount = await Follow.countDocuments({ following: userId });
        const followingCount = await Follow.countDocuments({ follower: userId });

        // Check if current user is following this user (if authenticated)
        let isFollowing = false;
        if (req.user && req.user.id !== userId) {
            const followRelation = await Follow.findOne({
                follower: req.user.id,
                following: userId
            });
            isFollowing = !!followRelation;
        }

        res.status(200).json({
            user: {
                ...user.toObject(),
                followersCount,
                followingCount,
                isFollowing: req.user ? isFollowing : undefined
            }
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ message: 'Failed to get user profile' });
    }
}

module.exports={
    Signup,
    Login,
    Logout,
    ShowAllUsers,
    ShowAllUsersWithStats,
    addPostToFavorites,
    getFavorites,
    getUserProfile
};