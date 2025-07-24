import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { User } from '../Models/User_Mod.js';
import generateToken from '../Configs/Token.js';
import { sendOtpEmail, sendPasswordResetEmail } from '../Configs/Email_service.js';


// Helper to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


// REGISTER USER
export const register = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, acceptedTerms, role } = req.body;
    if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

    if (!acceptedTerms) {
      return res.status(400).json({ message: 'You must accept the Terms and Privacy Policy' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 3 * 60 * 1000); 
    const newUser = await User.create({
      fullName,
      email,
      password,
      role: role || 'user',  
      otp: {
        code: otp,
        expiresAt: otpExpiry,
      },
      acceptedTerms,
    });

    await sendOtpEmail(email, otp);

    res.status(201).json({
      message: 'Registration successful. Please verify your email with the OTP sent.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

//verify otp
export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    // Find the user with this OTP
    const user = await User.findOne({ 'otp.code': otp });

    if (!user) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if OTP is expired
    if (!user.otp.expiresAt || user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    res.json({ message: 'OTP verified successfully. You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};


//Reset OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found with that email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Generate new OTP
    const newOtp = generateOTP();
    const newExpiry = new Date(Date.now() + 30 * 60 * 1000);

    user.otp = {
      code: newOtp,
      expiresAt: newExpiry,
    };

    await user.save();

    await sendOtpEmail(email, newOtp);

    res.json({ message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error resending OTP' });
  }
};


// LOGIN USER
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email before logging in' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};


// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found with that email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendPasswordResetEmail(email, resetUrl);

    res.json({ message: 'Password reset link sent to email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};


// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password has been reset. You can now log in with your new password.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

// GET USER PROFILE
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// UPDATE USER PROFILE
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fullName = req.body.fullName || user.fullName;
    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// DELETE USER ACCOUNT

export const deleteUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();

    res.json({ message: 'Your account has been deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting account' });
  }
};


// ADMIN ONLY - UPDATE USER ROLE
export const updateUserRole = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const { userId, newRole } = req.body;

    if (!['user', 'technician', 'admin'].includes(newRole)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = newRole;
    await user.save();

    res.json({ message: `User role updated to ${newRole}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating user role' });
  }
};

