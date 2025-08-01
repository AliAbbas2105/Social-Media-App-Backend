const express = require('express');
const router = express.Router();
const controller=require('../controllers/userController')
const {verifyLink} = require('../controllers/linkVerifyController')
const authenticateToken = require('../middlewares/authMiddleware');


router.post('/signup',controller.Signup);
router.get('/verify-link/:token', verifyLink);
router.post('/login', controller.Login);

router.use(authenticateToken);
router.get('/profile/:userId', controller.getUserProfile);
router.post('/logout', controller.Logout);
router.get('/showAllUsers',controller.ShowAllUsers);
router.get('/showAllUsersWithStats', controller.ShowAllUsersWithStats);
router.get('/getfavorites',controller.getFavorites);
router.post('/favorite/:postId',controller.addPostToFavorites);

module.exports = router;