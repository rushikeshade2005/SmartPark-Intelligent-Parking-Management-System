const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketHandler = (io) => {
  // Socket.io JWT authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        // Allow unauthenticated connections for public pages but mark them
        socket.user = null;
        return next();
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name role');
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      // Allow connection but mark as unauthenticated
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id} (user: ${socket.user?.name || 'anonymous'})`);

    // Join user-specific room for targeted notifications
    if (socket.user) {
      socket.join(`user_${socket.user._id}`);
    }

    // Join a parking lot room for targeted updates
    socket.on('joinLot', (lotId) => {
      socket.join(`lot_${lotId}`);
      console.log(`Socket ${socket.id} joined lot_${lotId}`);
    });

    socket.on('leaveLot', (lotId) => {
      socket.leave(`lot_${lotId}`);
    });

    // Handle real-time slot status changes
    socket.on('updateSlot', (data) => {
      io.to(`lot_${data.parkingLotId}`).emit('slotUpdate', data);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
