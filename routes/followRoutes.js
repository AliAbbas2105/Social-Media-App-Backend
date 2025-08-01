const express = require('express');
const router = express.Router();
const { 
    followUser, 
    unfollowUser, 
    getFollowers, 
    getFollowing, 
    checkFollowStatus, 
    getFollowStats,
    getMutualFollowers 
} = require('../controllers/followController');
const authenticateToken = require('../middlewares/authMiddleware');
router.use(authenticateToken);
router.get('/followers', getFollowers);
router.get('/following', getFollowing);
router.get('/stats', getFollowStats);
router.delete('/unfollow/:userId', unfollowUser);
router.get('/status/:userId', checkFollowStatus);
router.get('/mutual/:userId', getMutualFollowers);

router.post('/:userId'  , followUser);

module.exports = router;