# 🚀 Sandbox App Setup Guide

## Quick Start

### 1. Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cloudinary Configuration (Required for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

### 2. Development Mode (Mock Images)

If you don't have Cloudinary set up yet, the app will work in development mode with mock images:

- ✅ **Upload functionality works** with placeholder images
- ✅ **All features functional** except real image storage
- ✅ **No errors** - uses placeholder.com for mock images
- ⚠️ **Warning message** will appear in console about mock images

### 3. Production Setup (Real Images)

For production, you need to:

1. **Create a Cloudinary account** (free tier available)
2. **Get your credentials** from the Cloudinary dashboard
3. **Update `.env.local`** with real Cloudinary values
4. **Restart the development server**

## 🎯 Current Status

### ✅ What's Working
- **Image upload interface** with file type validation
- **Try Again button** for failed uploads
- **File type restrictions** (JPG, PNG, WebP, GIF only)
- **Size validation** (5MB max per image)
- **Mock image fallback** for development
- **Error handling** with clear messages
- **Progress indicators** during upload

### 🔧 What You Need to Do

1. **Create `.env.local`** file (copy from `env-example.txt`)
2. **Add your Supabase credentials** (required for app functionality)
3. **Add Cloudinary credentials** (optional for development, required for production)
4. **Run the app**: `npm run dev`

## 📱 Testing Upload Functionality

### Without Cloudinary (Development Mode)
1. Start the app: `npm run dev`
2. Go to `/dashboard/products/new`
3. Try uploading an image
4. You'll see a placeholder image (this is expected!)
5. Check browser console for warning about mock images

### With Cloudinary (Production Mode)
1. Set up Cloudinary account
2. Add real credentials to `.env.local`
3. Restart the server
4. Upload images will be stored in Cloudinary

## 🛠️ Troubleshooting

### Upload Error: "Failed to upload image"
- **Cause**: Missing Cloudinary environment variables
- **Solution**: Add Cloudinary credentials to `.env.local` or use development mode

### 404 Error on `/api/upload`
- **Cause**: API route not found
- **Solution**: Restart the development server

### File Type Error
- **Cause**: Uploading unsupported file type
- **Solution**: Use JPG, PNG, WebP, or GIF files only

## 🎨 Features Available

### Image Upload Components
- **Product Images**: Up to 5 images per product
- **Store Logo**: Single logo upload
- **Store Banner**: Single banner upload

### File Validation
- **Supported types**: JPG, JPEG, PNG, WebP, GIF
- **Max size**: 5MB per image
- **Auto-optimization**: Images are automatically optimized

### User Experience
- **Drag & drop**: Coming soon
- **Progress bars**: Real-time upload progress
- **Error handling**: Clear error messages with retry options
- **File type info**: Clear instructions on supported formats

## 🚀 Next Steps

1. **Set up environment variables**
2. **Test the upload functionality**
3. **Configure Cloudinary** for production
4. **Start building your store!**

---

**Need help?** Check the console for detailed error messages and warnings.
