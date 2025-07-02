const express = require('express');
const { getProfile, updateProfile, changePassword, getAddresses, addAddress, updateAddress, requestPhoneChange, confirmPhoneChange, requestEmailChange, confirmEmailChange } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/profile', verifyToken, getProfile);
router.post('/profile', verifyToken, updateProfile);
router.post('/change-password', verifyToken, changePassword);

router.get('/addresses', verifyToken, getAddresses);
router.post('/addresses', verifyToken, addAddress);
router.put('/addresses/:id', verifyToken, updateAddress);

router.post('/request-phone-change', verifyToken, requestPhoneChange);
router.post('/confirm-phone-change', verifyToken, confirmPhoneChange);
router.post('/request-email-change', verifyToken, requestEmailChange);
router.post('/confirm-email-change', verifyToken, confirmEmailChange);

module.exports = router;
