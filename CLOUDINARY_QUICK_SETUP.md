# 🚀 Cloudinary Quick Setup Guide

## How Image Upload Works

1. **User uploads image** → File sent to `/api/upload`
2. **API uploads to Cloudinary** → Gets back image URL
3. **URL stored in database** → Used to display images
4. **Images displayed** → Using the stored Cloudinary URLs

## Quick Setup (5 minutes)

### Step 1: Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for free account
3. Verify your email

### Step 2: Get Your Credentials
1. Go to your [Cloudinary Dashboard](https://console.cloudinary.com)
2. Copy these values:
   - **Cloud Name** (top of dashboard)
   - **API Key** (in "API Keys" section)
   - **API Secret** (click "Show" to reveal)

### Step 3: Update Environment Variables
Create/update your `.env.local` file:

```env
# Replace with your actual Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
```

### Step 4: Restart Server
```bash
npm run dev
```

## Current Status

### ✅ What's Working Now
- **Mock images** (placeholder images for testing)
- **Upload interface** (file selection, progress, error handling)
- **Database storage** (URLs are saved to database)
- **Image display** (images show up in your app)

### 🔧 What Happens Next
- **With Cloudinary**: Real images uploaded and stored
- **Without Cloudinary**: Mock images (still fully functional)

## Testing

### Test Upload (Mock Mode)
1. Go to: `http://localhost:3003/test-upload`
2. Upload any image
3. You'll see a random placeholder image
4. URL is still saved to database

### Test Upload (Real Mode)
1. Set up Cloudinary credentials
2. Restart server
3. Upload images
4. You'll see your actual uploaded images

## File Structure

```
📁 Your App
├── 📄 .env.local (your Cloudinary credentials)
├── 📁 app/api/upload/route.ts (handles uploads)
├── 📁 components/ui/cloudinary-upload.tsx (upload UI)
└── 📁 lib/cloudinary.ts (helper functions)
```

## How It Works

### 1. Upload Process
```javascript
// User selects file
const file = event.target.files[0]

// Send to API
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})

// Get back URL
const { url } = await response.json()

// Save URL to database
await supabase.from('products').update({ images: [url] })
```

### 2. Display Process
```javascript
// Get URL from database
const product = await supabase.from('products').select('images')

// Display image
<img src={product.images[0]} alt="Product" />
```

## Troubleshooting

### "Invalid cloud_name" Error
- **Cause**: Using placeholder values in `.env.local`
- **Fix**: Replace with real Cloudinary credentials

### Images Not Showing
- **Cause**: Invalid URLs in database
- **Fix**: Re-upload images with proper Cloudinary setup

### Upload Fails
- **Cause**: Network or configuration issue
- **Fix**: Check browser console for error details

## Free Tier Limits

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **Perfect for**: Small to medium stores

---

**Need help?** Check the browser console for detailed error messages.
