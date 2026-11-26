const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getExhibitors,
  getPendingExhibitors,
  approveExhibitor,
  getBookmarks,
  toggleBookmark,
} = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Public route for Attendee Exhibitors directory
router.get('/exhibitors', getExhibitors);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/exhibitors/pending', protect, authorizeRoles('admin'), getPendingExhibitors);
router.put('/exhibitors/:id/approve', protect, authorizeRoles('admin'), approveExhibitor);
router.get('/bookmarks', protect, authorizeRoles('attendee'), getBookmarks);
router.put('/bookmarks/:sessionId', protect, authorizeRoles('attendee'), toggleBookmark);

module.exports = router;