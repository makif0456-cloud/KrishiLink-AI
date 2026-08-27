const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const AuditLog = require('../models/AuditLog');

class AuthService {
  static async register(userData) {
    const existing = await User.findByPhone(userData.phone);
    if (existing) {
      const err = new Error('यह मोबाइल नंबर पहले से पंजीकृत है (This phone number is already registered)');
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await hashPassword(userData.password || 'Password@123');
    const newUser = await User.create({
      ...userData,
      password_hash: hashedPassword
    });

    await AuditLog.create({
      userId: newUser.id,
      action: 'register',
      entityType: 'user',
      entityId: newUser.id,
      details: { role: newUser.role, phone: newUser.phone }
    });

    const token = generateToken({ id: newUser.id, role: newUser.role, name: newUser.name });
    const { password_hash, ...safeUser } = newUser;

    return { user: safeUser, token };
  }

  static async login(phone, password) {
    const user = await User.findByPhone(phone);
    if (!user) {
      const err = new Error('मोबाइल नंबर या पासवर्ड गलत है (Invalid phone or password)');
      err.statusCode = 401;
      throw err;
    }

    if (!user.is_active) {
      const err = new Error('खाता निष्क्रिय कर दिया गया है (Account has been deactivated)');
      err.statusCode = 403;
      throw err;
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('मोबाइल नंबर या पासवर्ड गलत है (Invalid phone or password)');
      err.statusCode = 401;
      throw err;
    }

    await AuditLog.create({
      userId: user.id,
      action: 'login',
      entityType: 'user',
      entityId: user.id,
      details: { role: user.role }
    });

    const token = generateToken({ id: user.id, role: user.role, name: user.name });
    const { password_hash, ...safeUser } = user;

    return { user: safeUser, token };
  }

  // Simulated OTP for SIH demo
  static async sendOtp(phone) {
    const demoOtp = '123456';
    return {
      phone,
      otp: demoOtp,
      message_hi: `प्रदर्शन ओटीपी: ${demoOtp} (Demo OTP for testing)`,
      message_en: `Demo OTP: ${demoOtp}`
    };
  }

  static async verifyOtp(phone, otp) {
    if (otp === '123456') {
      let user = await User.findByPhone(phone);
      if (!user) {
        // Auto-create demo farmer account if not existing
        const hashedPassword = await hashPassword('Password@123');
        user = await User.create({
          phone,
          name: `किसान (${phone.slice(-4)})`,
          role: 'farmer',
          password_hash: hashedPassword
        });
      }
      const token = generateToken({ id: user.id, role: user.role, name: user.name });
      const { password_hash, ...safeUser } = user;
      return { user: safeUser, token };
    }
    const err = new Error('अमान्य ओटीपी कोड (Invalid OTP)');
    err.statusCode = 400;
    throw err;
  }
}

module.exports = AuthService;
