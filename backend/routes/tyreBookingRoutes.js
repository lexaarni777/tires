const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bookingController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Public endpoints
router.get('/services', ctrl.getServices);
router.get('/prices', ctrl.getPrices); // ?radius=R17
router.get('/availability', ctrl.getAvailability); // ?date=YYYY-MM-DD
router.post('/quote', ctrl.quote);
router.post('/book', ctrl.book); // optional auth via bearer token

// Admin
router.get('/bookings', verifyToken, verifyAdmin, ctrl.adminList);
router.patch('/bookings/:id', verifyToken, verifyAdmin, ctrl.adminUpdate);
router.post('/admin/bookings', verifyToken, verifyAdmin, ctrl.adminCreate);

router.get('/admin/services', verifyToken, verifyAdmin, ctrl.adminServicesList);
router.post('/admin/services', verifyToken, verifyAdmin, ctrl.adminServiceCreate);
router.patch('/admin/services/:id', verifyToken, verifyAdmin, ctrl.adminServiceUpdate);
router.delete('/admin/services/:id', verifyToken, verifyAdmin, ctrl.adminServiceDelete);

router.get('/admin/prices', verifyToken, verifyAdmin, ctrl.adminPricesGet); // ?service_id=ID
router.put('/admin/prices', verifyToken, verifyAdmin, ctrl.adminPricesPut);

router.get('/admin/settings', verifyToken, verifyAdmin, ctrl.adminSettingsGet);
router.put('/admin/settings', verifyToken, verifyAdmin, ctrl.adminSettingsPut);

// User self-service
router.get('/my-bookings', verifyToken, ctrl.userListMine);
router.patch('/my-bookings/:id', verifyToken, ctrl.userUpdateMine);

module.exports = router;
