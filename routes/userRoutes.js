const express = require('express');
const router = express.Router();
const controller=require('../controllers/userController')
const {verifyLink} = require('../controllers/linkVerifyController')
const authenticateToken = require('../middlewares/authMiddleware');


router.post('/signup',controller.Signup);
router.get('/verify-link/:token', verifyLink);
router.post('/login', controller.Login);

router.use(authenticateToken);
router.post('/logout', controller.Logout);
router.get('/showAllUsers',controller.ShowAllUsers);
router.post('/favorite/:postId',controller.addPostToFavorites);
router.get('/getfavorites',controller.getFavorites);

module.exports = router;