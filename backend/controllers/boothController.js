const Booth = require('../models/Booth');

const formatBooth = (boothDoc) => {
  const obj = boothDoc.toObject ? boothDoc.toObject() : boothDoc;
  return {
    ...obj,
    event: obj.eventId,
    exhibitor:
      obj.exhibitorId && typeof obj.exhibitorId === 'object' ? obj.exhibitorId : null,
  };
};

// @desc    Get all booths for a specific event's floor plan
// @route   GET /api/booths/:eventId
// @access  Public
const getBooths = async (req, res) => {
  try {
    const booths = await Booth.find({ eventId: req.params.eventId })
      .populate('exhibitorId', 'name companyName logoUrl')
      .sort({ boothNumber: 1 });

    res.status(200).json(booths.map(formatBooth));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new booth (Admin drawing the floor plan)
// @route   POST /api/booths
// @access  Private (Admin only)
const createBooth = async (req, res) => {
  try {
    const { eventId, event, boothNumber, zone, size, price, status, coordinates } = req.body;
    const resolvedEventId = eventId || event;

    if (!resolvedEventId || !boothNumber || !coordinates) {
      return res
        .status(400)
        .json({ message: 'eventId, boothNumber, and coordinates are required' });
    }

    const booth = await Booth.create({
      eventId: resolvedEventId,
      boothNumber,
      zone: zone || 'Hall A',
      size: size || '3m x 3m',
      price: price ?? 500,
      status: status || 'Available',
      coordinates,
    });

    const formatted = formatBooth(booth);
    req.io.emit('boothUpdated', formatted);

    res.status(201).json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Book a booth
// @route   PUT /api/booths/:id/book
// @access  Private (Exhibitor only)
const bookBooth = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.id);

    if (!booth) {
      return res.status(404).json({ message: 'Booth not found' });
    }

    if ((booth.status || '').toLowerCase() !== 'available') {
      return res.status(400).json({ message: 'This booth is already reserved' });
    }

    booth.status = 'Booked';
    booth.exhibitorId = req.user._id || req.user.id;
    await booth.save();

    await booth.populate('exhibitorId', 'name companyName logoUrl');
    const formatted = formatBooth(booth);

    req.io.emit('boothUpdated', formatted);

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getBooths, createBooth, bookBooth };