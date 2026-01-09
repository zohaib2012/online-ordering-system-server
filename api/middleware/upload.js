import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv'
dotenv.config()
// Configure Cloudinary
cloudinary.config({
  // cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  // api_key: process.env.CLOUDINARY_API_KEY,
  // api_secret: process.env.CLOUDINARY_API_SECRET
  	cloud_name: "dyiihhkgz",
	api_key: "264889929517893",
	api_secret: "Sa8A2JMfDTCa0n_ZXvq8EaT7pMA",
});
console.log('e')
// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'food-ordering',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }],
    resource_type: 'auto'
  }
});

export const test=(req,res)=>{
  try {
    console.log('dsd')
       return res.status(200).json({message:'test1 hit'})
  } catch (error) {
    console.log(error)
  }
}
export const test1=(req,res)=>{
  try {
    console.log('test1')
    return res.status(200).json({message:'test1 hit'})
  } catch (error) {
    console.log(error)
  }
}

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(file.mimetype);
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed (jpeg, jpg, png, webp)'));
  }
});

export default upload;