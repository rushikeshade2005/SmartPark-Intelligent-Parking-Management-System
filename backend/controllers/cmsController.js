const ContactInfo = require('../models/ContactInfo');
const FooterContent = require('../models/FooterContent');

// ─── Contact Info ────────────────────────────────────────────────

// @desc    Get contact info (public)
// @route   GET /api/cms/contact-info
exports.getContactInfo = async (req, res, next) => {
  try {
    let info = await ContactInfo.findOne();
    if (!info) {
      info = await ContactInfo.create({});
    }
    res.json({ success: true, data: info });
  } catch (error) {
    next(error);
  }
};

// @desc    Update contact info (admin)
// @route   PUT /api/cms/contact-info
exports.updateContactInfo = async (req, res, next) => {
  try {
    const { address, phone, email, supportEmail, mapLink } = req.body;
    let info = await ContactInfo.findOne();
    if (!info) {
      info = await ContactInfo.create({ address, phone, email, supportEmail, mapLink });
    } else {
      info.address = address ?? info.address;
      info.phone = phone ?? info.phone;
      info.email = email ?? info.email;
      info.supportEmail = supportEmail ?? info.supportEmail;
      info.mapLink = mapLink ?? info.mapLink;
      await info.save();
    }
    res.json({ success: true, message: 'Contact info updated', data: info });
  } catch (error) {
    next(error);
  }
};

// ─── Footer Content ──────────────────────────────────────────────

// @desc    Get footer content (public)
// @route   GET /api/cms/footer
exports.getFooterContent = async (req, res, next) => {
  try {
    let content = await FooterContent.findOne();
    if (!content) {
      content = await FooterContent.create({});
    }
    res.json({ success: true, data: content });
  } catch (error) {
    next(error);
  }
};

// @desc    Update footer content (admin)
// @route   PUT /api/cms/footer
exports.updateFooterContent = async (req, res, next) => {
  try {
    const { companyDescription, quickLinks, services, socialLinks, contactInfo, copyright } = req.body;
    let content = await FooterContent.findOne();
    if (!content) {
      content = await FooterContent.create(req.body);
    } else {
      if (companyDescription !== undefined) content.companyDescription = companyDescription;
      if (quickLinks !== undefined) content.quickLinks = quickLinks;
      if (services !== undefined) content.services = services;
      if (socialLinks !== undefined) content.socialLinks = socialLinks;
      if (contactInfo !== undefined) content.contactInfo = contactInfo;
      if (copyright !== undefined) content.copyright = copyright;
      await content.save();
    }
    res.json({ success: true, message: 'Footer content updated', data: content });
  } catch (error) {
    next(error);
  }
};
