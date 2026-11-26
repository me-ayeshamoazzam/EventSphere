const User = require('../models/User');

// @desc    Get logged-in user's profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile (Exhibitor/Attendee)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.companyName !== undefined) user.companyName = req.body.companyName;
    if (req.body.companyDescription !== undefined) {
      user.companyDescription = req.body.companyDescription;
    }
    if (req.body.logoUrl !== undefined) user.logoUrl = req.body.logoUrl;

    const updatedUser = await user.save();
    const { password, ...safeUser } = updatedUser.toObject();
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all approved exhibitors for the public directory
// @route   GET /api/users/exhibitors
// @access  Public
const getExhibitors = async (req, res) => {
  try {
    const exhibitors = await User.find({ role: 'exhibitor', isApproved: true }).select('-password');
    res.json(exhibitors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get pending exhibitors
// @route   GET /api/users/exhibitors/pending
// @access  Admin only
const getPendingExhibitors = async (req, res) => {
  try {
    const exhibitors = await User.find({ role: 'exhibitor', isApproved: false }).select('-password');
    res.json(exhibitors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Approve an exhibitor
// @route   PUT /api/users/exhibitors/:id/approve
// @access  Admin only
const approveExhibitor = async (req, res) => {
  try {
    const exhibitor = await User.findById(req.params.id);
    if (!exhibitor || exhibitor.role !== 'exhibitor') {
      return res.status(404).json({ message: 'Exhibitor not found' });
    }

    exhibitor.isApproved = true;
    await exhibitor.save();

    const { password, ...safeExhibitor } = exhibitor.toObject();
    res.json({ message: 'Exhibitor approved', exhibitor: safeExhibitor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get logged-in attendee's bookmarked session IDs
// @route   GET /api/users/bookmarks
// @access  Attendee only
const getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select('bookmarks');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user.bookmarks || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Toggle a bookmark (Add/Remove)
// @route   PUT /api/users/bookmarks/:sessionId
// @access  Attendee only
const toggleBookmark = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { sessionId } = req.params;
    user.bookmarks = user.bookmarks || [];

    if (user.bookmarks.includes(sessionId)) {
      user.bookmarks = user.bookmarks.filter((id) => id !== sessionId);
    } else {
      user.bookmarks.push(sessionId);
    }

    await user.save();
    res.json(user.bookmarks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getExhibitors,
  getPendingExhibitors,
  approveExhibitor,
  getBookmarks,
  toggleBookmark,
};