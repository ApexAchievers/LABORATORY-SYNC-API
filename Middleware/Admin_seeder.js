import { User } from '../Models/User_Mod.js';

export const seedAdmin = async () => {
  const existingAdmin = await User.findOne({ email: 'c39744736@gmail.com' });

  if (!existingAdmin) {
    await User.create({
      firstName: "Comfort",
      lastName: "Parker",
      email: "c39744736@gmail.com",
      password: "admin123", // Plain text, Mongoose will hash it
      role: "admin",
      acceptedTerms: true,
      isVerified: true,
    });
    console.log('Admin user created');
  } else {
    console.log('Admin already exists');
  }
};
