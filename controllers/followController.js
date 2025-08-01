const User = require('../models/user');
const Follow = require('../models/Follow');

async function followUser(req, res) {
    try {
        const followerId = req.user.id;
        const followingId = req.params.userId;

        // Check if target user exists
        const targetUser = await User.findById(followingId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found, whom you want to follow' });
        }

        // Check if already following
        const existingFollow = await Follow.findOne({ 
            follower: followerId, 
            following: followingId 
        });
        
        if (existingFollow) {
            return res.status(400).json({ message: 'Already following this user' });
        }

        // Create new follow relationship
        const newFollow = new Follow({
            follower: followerId,
            following: followingId
        });

        await newFollow.save();
        res.status(200).json({ message: 'Successfully followed user' });

    } catch (error) {
        console.error('Follow user error:', error);
        if (error.message === 'Users cannot follow themselves') {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }
        res.status(500).json({ message: 'Failed to follow user' });
    }
}

async function unfollowUser(req, res) {
    try {
        const followerId = req.user.id;
        const followingId = req.params.userId;

        const follow = await Follow.findOneAndDelete({
            follower: followerId,
            following: followingId
        });

        if (!follow) {
            return res.status(404).json({ message: 'Follow relationship not found' });
        }

        res.status(200).json({ message: 'Successfully unfollowed user' });

    } catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({ message: 'Failed to unfollow user' });
    }
}

async function getFollowers(req, res) {
    try {
        const userId = req.params.userId || req.user.id;

        const followers = await Follow.find({ following: userId })
            .populate({
                path: 'follower',
                select: 'username'
            });

        const followerList = followers.map(follow => ({
            id: follow.follower._id,
            username: follow.follower.username,
            followedAt: follow.createdAt
        }));

        res.status(200).json({
            message: 'Followers retrieved successfully',
            count: followerList.length,
            data: followerList
        });

    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ message: 'Failed to get followers' });
    }
}

async function getFollowing(req, res) {
    try {
        const userId = req.params.userId || req.user.id;

        const following = await Follow.find({ follower: userId })
            .populate({
                path: 'following',
                select: 'username email'
            });

        const followingList = following.map(follow => ({
            id: follow.following._id,
            username: follow.following.username,
            email: follow.following.email,
            followedAt: follow.createdAt
        }));

        res.status(200).json({
            message: 'Following list retrieved successfully',
            count: followingList.length,
            data: followingList
        });

    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ message: 'Failed to get following list' });
    }
}

// Check if current user is following another user
async function checkFollowStatus(req, res) {
    try {
        const followerId = req.user.id;
        const followingId = req.params.userId;

        const isFollowing = await Follow.findOne({
            follower: followerId,
            following: followingId
        });

        res.status(200).json({
            // These are all equivalent:
            isFollowing : !!isFollowing
            // isFollowing = isFollowing ? true : false;
            // isFollowing = Boolean(isFollowing);
        });

    } catch (error) {
        console.error('Check follow status error:', error);
        res.status(500).json({ message: 'Failed to check follow status' });
    }
}

// Get follow statistics for a user
async function getFollowStats(req, res) {
    try {
        const userId = req.user.id;

        const followersCount = await Follow.countDocuments({ following: userId });
        const followingCount = await Follow.countDocuments({ follower: userId });

        res.status(200).json({
            userId,
            followersCount,
            followingCount
        });

    } catch (error) {
        console.error('Get follow stats error:', error);
        res.status(500).json({ message: 'Failed to get follow statistics' });
    }
}

// Get mutual followers (users who follow both current user and target user)
async function getMutualFollowers(req, res) {
    try {
        const currentUserId = req.user.id;
        const targetUserId = req.params.userId;

        // Get followers of current user
        const currentUserFollowers = await Follow.find({ following: currentUserId })
            .select('follower');
        const currentFollowerIds = currentUserFollowers.map(f => f.follower.toString());

        // Get followers of target user who are also following current user
        const mutualFollowers = await Follow.find({ 
            following: targetUserId,
            follower: { $in: currentFollowerIds }
        }).populate({
            path: 'follower',
            select: 'username email'
        });

        const mutualList = mutualFollowers.map(follow => ({
            id: follow.follower._id,
            username: follow.follower.username,
            email: follow.follower.email
        }));

        res.status(200).json({
            message: 'Mutual followers retrieved successfully',
            count: mutualList.length,
            data: mutualList
        });

    } catch (error) {
        console.error('Get mutual followers error:', error);
        res.status(500).json({ message: 'Failed to get mutual followers' });
    }
}

module.exports = {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    checkFollowStatus,
    getFollowStats,
    getMutualFollowers
};