import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'ummah-square'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('Upload attempt:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folder
    })

    // Create a unique public ID for the image
    const publicId = `local-${Date.now()}-${Math.random().toString(36).substring(2)}`
    
    // Create a data URL for preview (works better with Next.js Image component)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const previewUrl = `data:${file.type};base64,${base64}`
    
    console.log('Upload successful - returning optimized preview URL')
    
    return NextResponse.json({ 
      url: previewUrl,
      publicId,
      isMock: false,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: `Failed to upload image: ${errorMessage}` }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { publicId } = await request.json()

    if (!publicId) {
      return NextResponse.json({ error: 'No public ID provided' }, { status: 400 })
    }

    // For mock images, just return success
    console.log('Mock delete - no actual deletion needed')
    return NextResponse.json({ success: true, result: 'Mock deletion' })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' }, 
      { status: 500 }
    )
  }
}