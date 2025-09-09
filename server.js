const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Gmail transporter
const gmailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Send OTP route
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  const otp = generateOTP();
  otpStore.set(email, { otp, timestamp: Date.now() });
  
  const otpMailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '💎 DIAMOND ATELIER - Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 2px;">💎 DIAMOND ATELIER</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">Email Verification</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; text-align: center;">
          <h2 style="color: #333; margin-top: 0;">Your Verification Code</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px dashed #007bff;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p style="color: #666; margin: 20px 0;">Enter this code to verify your email address</p>
          <p style="color: #999; font-size: 12px;">This code expires in 10 minutes</p>
        </div>
      </div>
    `
  };
  
  try {
    await gmailTransporter.sendMail(otpMailOptions);
    res.status(200).json({ message: 'OTP sent successfully!' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP route
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }
  
  const storedData = otpStore.get(email);
  
  if (!storedData) {
    return res.status(400).json({ error: 'OTP not found or expired' });
  }
  
  // Check if OTP is expired (10 minutes)
  if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP expired' });
  }
  
  if (storedData.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  
  // OTP verified, remove from store
  otpStore.delete(email);
  res.status(200).json({ message: 'Email verified successfully!' });
});

app.post('/api/contact', upload.single('file'), async (req, res) => {
  const { name, subject, email, phone, message } = req.body;
  const uploadedFile = req.file;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  // Prepare attachments array
  const attachments = [];
  if (uploadedFile) {
    attachments.push({
      filename: uploadedFile.originalname,
      path: uploadedFile.path
    });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECIPIENT_EMAIL,
    subject: `🔷 DIAMOND ATELIER - New Contact Inquiry from ${name}`,
    attachments: attachments,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">💎 DIAMOND ATELIER</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">Premium Lab-Grown Diamonds</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0; font-size: 22px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">📧 New Contact Form Inquiry</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">📅 <strong>Received:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">🌐 <strong>Source:</strong> Diamond Atelier AI Chatbot</p>
            ${uploadedFile ? `<p style="margin: 0; color: #666; font-size: 14px;">📎 <strong>Attachment:</strong> ${uploadedFile.originalname}</p>` : ''}
          </div>
          
          <div style="margin: 25px 0;">
            <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">👤 Customer Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555; width: 120px;">📝 Name:</td>
                <td style="padding: 12px 0; color: #333;">${name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555;">📝 Subject:</td>
                <td style="padding: 12px 0; color: #333;">${subject || '❌ Not provided'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555;">📧 Email:</td>
                <td style="padding: 12px 0; color: #333;"><a href="mailto:${email}" style="color: #007bff; text-decoration: none;">${email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555;">📱 Phone:</td>
                <td style="padding: 12px 0; color: #333;">${phone || '❌ Not provided'}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin: 25px 0;">
            <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">💬 Customer Message:</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
              <p style="margin: 0; color: #333; line-height: 1.6; font-style: italic;">${message}</p>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 30px;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px;">⚡ Quick Actions</h3>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Reply to customer within 24 hours for best experience</p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p style="margin: 0;">© 2024 Diamond Atelier | Surat, Gujarat, India</p>
          <p style="margin: 5px 0 0 0;">🌟 Premium Lab-Grown Diamonds | 24/7 Customer Support</p>
        </div>
      </div>
    `
  };

  try {
    await gmailTransporter.sendMail(mailOptions);
    
    // Clean up uploaded file after sending email
    if (uploadedFile && fs.existsSync(uploadedFile.path)) {
      fs.unlinkSync(uploadedFile.path);
    }
    
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Clean up file if email fails
    if (uploadedFile && fs.existsSync(uploadedFile.path)) {
      fs.unlinkSync(uploadedFile.path);
    }
    
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});