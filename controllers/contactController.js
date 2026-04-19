const Contact = require('../models/Contact');
const { sendContactReplyEmail } = require('../services/emailService');

// @desc    Submit a contact message (public — anyone can submit)
// @route   POST /api/contact
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const contact = await Contact.create({
      name,
      email,
      subject,
      message,
      userId: req.user ? req.user._id : null,
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all contact messages (admin)
// @route   GET /api/contact
exports.getContacts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;

    const total = await Contact.countDocuments(query);
    const contacts = await Contact.find(query)
      .populate('userId', 'name email')
      .populate('repliedBy', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single contact message (admin)
// @route   GET /api/contact/:id
exports.getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('repliedBy', 'name');

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Auto-mark as read if unread
    if (contact.status === 'unread') {
      contact.status = 'read';
      await contact.save();
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc    Reply to a contact message (admin)
// @route   PUT /api/contact/:id/reply
exports.replyContact = async (req, res, next) => {
  try {
    const { reply } = req.body;
    if (!reply) {
      return res.status(400).json({ success: false, message: 'Reply is required' });
    }

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    contact.adminReply = reply;
    contact.status = 'replied';
    contact.repliedAt = new Date();
    contact.repliedBy = req.user._id;
    await contact.save();

    // Send reply email (non-blocking)
    try {
      await sendContactReplyEmail(contact);
    } catch (emailErr) {
      console.error('Contact reply email failed:', emailErr.message);
    }

    res.json({ success: true, message: 'Reply sent successfully', data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc    Update message status (admin)
// @route   PUT /api/contact/:id/status
exports.updateContactStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['unread', 'read', 'replied', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a contact message (admin)
// @route   DELETE /api/contact/:id
exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's own messages (authenticated user)
// @route   GET /api/contact/my-messages
exports.getMyMessages = async (req, res, next) => {
  try {
    const messages = await Contact.find({ userId: req.user._id })
      .populate('repliedBy', 'name')
      .sort('-createdAt');

    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Get contact stats (admin)
// @route   GET /api/contact/stats
exports.getContactStats = async (req, res, next) => {
  try {
    const total = await Contact.countDocuments();
    const unread = await Contact.countDocuments({ status: 'unread' });
    const read = await Contact.countDocuments({ status: 'read' });
    const replied = await Contact.countDocuments({ status: 'replied' });
    const resolved = await Contact.countDocuments({ status: 'resolved' });

    res.json({
      success: true,
      data: { total, unread, read, replied, resolved },
    });
  } catch (error) {
    next(error);
  }
};
