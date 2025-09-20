# Cloudinary Setup Guide

This guide will help you set up Cloudinary for image uploads and management in your Sandbox application.

## 1. Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

## 2. Get Your Cloudinary Credentials

After logging into your Cloudinary dashboard:

1. **Cloud Name**: Found in the "Dashboard" section at the top
2. **API Key**: Found in the "Dashboard" section
3. **API Secret**: Found in the "Dashboard" section (click "Show" to reveal)

## 3. No Upload Preset Needed

With our server-side upload implementation, you don't need to create an upload preset. The uploads are handled securely through our API routes.

## 4. Environment Variables

Add these variables to your `.env.local` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
```

**Note**: The `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is needed for client-side image optimization. Use the same value as `CLOUDINARY_CLOUD_NAME`.

## 5. Folder Structure

Your Cloudinary account will automatically organize images into these folders:

- `sandbox/products/` - Product images
- `sandbox/logos/` - Store logos
- `sandbox/banners/` - Store banners

## 6. Features Included

### Image Upload Component
- Drag & drop or click to upload
- Progress indicators
- Error handling
- Image preview
- Remove functionality
- File validation (type and size)

### Optimized Image Display
- Automatic format optimization (WebP, AVIF)
- Quality optimization
- Responsive sizing
- Lazy loading
- Blur placeholders

### Image Management
- Automatic folder organization
- Easy deletion
- URL generation for different sizes
- CDN delivery for fast loading

## 7. Usage Examples

### Upload Images in Product Form
```tsx
<CloudinaryUpload
  onUpload={(url) => setImages([...images, url])}
  onRemove={(url) => setImages(images.filter(img => img !== url))}
  existingImages={images}
  maxImages={5}
  folder="sandbox/products"
/>
```

### Display Optimized Images
```tsx
<CloudinaryImage
  src={imageUrl}
  alt="Product image"
  width={400}
  height={400}
  quality="auto"
  crop="fill"
/>
```

## 8. Free Tier Limits

Cloudinary's free tier includes:
- 25 GB storage
- 25 GB bandwidth per month
- 25,000 transformations per month

This is more than enough for most small to medium applications.

## 9. Security Best Practices

1. **Use unsigned uploads** for client-side uploads (already configured)
2. **Set folder restrictions** in upload presets
3. **Use HTTPS** for all image URLs (automatically handled)
4. **Validate file types** on both client and server (already implemented)

## 10. Troubleshooting

### Common Issues:

1. **Upload fails**: Check your upload preset is set to "Unsigned"
2. **Images not displaying**: Verify your cloud name is correct
3. **CORS errors**: Ensure your domain is added to Cloudinary's allowed origins (if needed)

### Getting Help:
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Support](https://support.cloudinary.com)

## 11. Production Considerations

For production deployment:

1. **Set up a custom domain** for your images
2. **Configure CDN** for better performance
3. **Set up monitoring** for usage and costs
4. **Implement backup strategies** for important images

Your Sandbox application is now ready to handle professional image uploads and management!
