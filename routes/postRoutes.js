const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authMiddleware');
const controller=require('../controllers/postController')

router.use(authenticateToken);
router.post('/create',controller.createPost);
router.get('/timeline',controller.getTimeline);
router.get('/:id',controller.getPostById);
router.post('/:postId/like', controller.LikeUnlikePost);
router.post('/:postId/comment', controller.addComment);
router.get('/:postId/getlikes', controller.getUsersWhoLiked);
router.get('/:postId/getcomments', controller.getComments);

module.exports = router;