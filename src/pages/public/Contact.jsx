import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineCheckCircle, HiOutlineGlobe } from 'react-icons/hi';

const Contact = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const res = await api.get('/cms/contact-info');
        setContactInfo(res.data.data);
      } catch {
        // fallback to defaults
      }
    };
    fetchContactInfo();
  }, []);

  const infoItems = [
    { icon: HiOutlineLocationMarker, title: 'Address', info: contactInfo?.address || 'Smart City Tower, Sector 42, Gurgaon' },
    { icon: HiOutlinePhone, title: 'Phone', info: contactInfo?.phone || '+91 98765 43210' },
    { icon: HiOutlineMail, title: 'Email', info: contactInfo?.email || 'support@smartpark.com' },
    ...(contactInfo?.supportEmail ? [{ icon: HiOutlineGlobe, title: 'Support', info: contactInfo.supportEmail }] : []),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/contact', form);
      toast.success('Message sent successfully!');
      setForm({ name: user?.name || '', email: user?.email || '', subject: '', message: '' });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Get in <span className="text-primary-600">Touch</span>
          </h1>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
            Have questions? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            {infoItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card flex items-start gap-4"
              >
                <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                  <item.icon size={20} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.info}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 card"
          >
            {submitted ? (
              <div className="text-center py-12">
                <HiOutlineCheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Message Sent!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Thank you for reaching out. Our team will review your message and get back to you soon.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn-primary"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Send us a Message</h2>
                {user && (
                  <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                    ✓ Logged in as {user.name} — your message will be linked to your account
                  </p>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="input-field"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Your Email"
                      className="input-field"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Subject"
                    className="input-field"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                  />
                  <textarea
                    placeholder="Your Message"
                    rows="5"
                    className="input-field resize-none"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                  />
                  <button type="submit" disabled={submitting} className="btn-primary w-full md:w-auto">
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
