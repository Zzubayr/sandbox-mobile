import { toast } from '@/hooks/use-toast'

export const toastHelpers = {
  success: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'success',
    })
  },

  error: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'destructive',
    })
  },

  warning: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'warning',
    })
  },

  info: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'info',
    })
  },

  // Specific toast messages for common actions
  productCreated: (productName: string) => {
    toast({
      title: 'Product Created',
      description: `${productName} has been successfully created.`,
      variant: 'success',
    })
  },

  productUpdated: (productName: string) => {
    toast({
      title: 'Product Updated',
      description: `${productName} has been successfully updated.`,
      variant: 'success',
    })
  },

  productDeleted: (productName: string) => {
    toast({
      title: 'Product Deleted',
      description: `${productName} has been successfully deleted.`,
      variant: 'success',
    })
  },

  productStatusChanged: (productName: string, status: string) => {
    toast({
      title: 'Product Status Updated',
      description: `${productName} is now ${status}.`,
      variant: 'success',
    })
  },

  addedToCart: (productName: string) => {
    toast({
      title: 'Added to Cart',
      description: `${productName} has been added to your cart.`,
      variant: 'success',
    })
  },

  removedFromCart: (productName: string) => {
    toast({
      title: 'Removed from Cart',
      description: `${productName} has been removed from your cart.`,
      variant: 'success',
    })
  },

  cartCleared: () => {
    toast({
      title: 'Cart Cleared',
      description: 'All items have been removed from your cart.',
      variant: 'success',
    })
  },

  requestSubmitted: () => {
    toast({
      title: 'Request Submitted',
      description: 'Your request has been sent to the vendor.',
      variant: 'success',
    })
  },

  requestStatusUpdated: (status: string) => {
    toast({
      title: 'Request Updated',
      description: `Request status changed to ${status}.`,
      variant: 'success',
    })
  },

  settingsSaved: () => {
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been successfully saved.',
      variant: 'success',
    })
  },

  imageUploaded: () => {
    toast({
      title: 'Image Uploaded',
      description: 'Your image has been successfully uploaded.',
      variant: 'success',
    })
  },

  imageDeleted: () => {
    toast({
      title: 'Image Deleted',
      description: 'Image has been successfully deleted.',
      variant: 'success',
    })
  },

  storeLinkCopied: () => {
    toast({
      title: 'Link Copied',
      description: 'Store link has been copied to clipboard.',
      variant: 'success',
    })
  },

  searchCompleted: (resultsCount: number) => {
    toast({
      title: 'Search Completed',
      description: `Found ${resultsCount} result${resultsCount !== 1 ? 's' : ''}.`,
      variant: 'info',
    })
  },

  noSearchResults: () => {
    toast({
      title: 'No Results Found',
      description: 'Try adjusting your search terms or filters.',
      variant: 'warning',
    })
  },

  // Error messages
  uploadError: (error?: string) => {
    toast({
      title: 'Upload Failed',
      description: error || 'Failed to upload file. Please try again.',
      variant: 'destructive',
    })
  },

  saveError: (error?: string) => {
    toast({
      title: 'Save Failed',
      description: error || 'Failed to save changes. Please try again.',
      variant: 'destructive',
    })
  },

  deleteError: (error?: string) => {
    toast({
      title: 'Delete Failed',
      description: error || 'Failed to delete item. Please try again.',
      variant: 'destructive',
    })
  },

  networkError: () => {
    toast({
      title: 'Network Error',
      description: 'Please check your internet connection and try again.',
      variant: 'destructive',
    })
  },

  unauthorized: () => {
    toast({
      title: 'Access Denied',
      description: 'You do not have permission to perform this action.',
      variant: 'destructive',
    })
  },

  // Loading states
  loading: (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: 'info',
    })
  },

  // Update loading toast to success/error
  updateLoadingToast: (toastId: any, success: boolean, title: string, description?: string) => {
    toastId.update({
      title,
      description,
      variant: success ? 'success' : 'destructive',
    })
  },
}
