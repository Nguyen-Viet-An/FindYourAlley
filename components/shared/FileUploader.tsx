'use client'

import { useCallback, useState } from 'react'
import type { FileWithPath } from 'react-dropzone'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import imageCompression from 'browser-image-compression';
import { convertFileToUrl } from '@/lib/utils'

type FileUploaderProps = {
  onFieldChange: (url: string) => void
  imageUrl: string
  setFiles: (files: File[]) => void 
}

export function FileUploader({ imageUrl, onFieldChange, setFiles }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length === 0) return
    
    // Set files for reference
    setFiles(acceptedFiles as File[])
    
    try {
      setIsUploading(true)

      let file = acceptedFiles[0]
      console.log("Uploading file:", acceptedFiles[0])
      console.log("Type:", acceptedFiles[0].type, "Size:", acceptedFiles[0].size)

      // Compress image if it's too large
      if (file.size > 8 * 1024 * 1024) { // 8MB threshold to stay safe
        console.log('Compressing image...')
        const options = {
          maxSizeMB: 8, // Maximum size in MB
          maxWidthOrHeight: 1920, // Max dimension
          useWebWorker: true,
          fileType: 'image/jpeg', // Convert to JPEG for better compression
          quality: 0.8 // 80% quality
        }
        
        file = await imageCompression(file, options)
        console.log('Compressed from', acceptedFiles[0].size, 'to', file.size)
      }

      // Create preview with compressed file
      const previewUrl = URL.createObjectURL(file)
      onFieldChange(previewUrl)

      // Cloudinary unsigned upload
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!) // your preset
      formData.append("cloud_name", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!) // optional if using unsigned

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      // console.log('Upload successful:', {
      //   public_id: data.public_id,
      //   secure_url: data.secure_url,
      //   width: data.width,
      //   height: data.height,
      //   format: data.format,
      //   resource_type: data.resource_type,
      //   created_at: data.created_at
      // })

      // Cloudinary returns secure_url (full CDN link)
      onFieldChange(data.secure_url)
    } catch (error) {
      console.error('Error uploading file to Cloudinary:', error)
    } finally {
      setIsUploading(false)
    }
  }, [onFieldChange, setFiles])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg']
    },
    maxFiles: 1
  })

  return (
    <div 
      {...getRootProps()} 
      className="flex-center bg-dark-3 flex h-72 cursor-pointer flex-col overflow-hidden rounded-xl bg-grey-50"
    >
      <input {...getInputProps()} className="cursor-pointer" />
      
      {imageUrl ? (
        <div className="flex h-full w-full flex-1 justify-center relative">
          <img 
            src={imageUrl} 
            alt="image" 
            width={250} 
            height={250} 
            className="w-full object-cover object-center" 
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-white">Uploading...</div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-center flex-col py-5 text-grey-500">
          <img 
            src="/assets/icons/upload.svg" 
            width={77} 
            height={77} 
            alt="file upload" 
          />
          <h3 className="mb-2 mt-2">Thả ảnh vào đây</h3>
          <p className="p-medium-12 mb-4">Loại file được hỗ trợ: PNG, JPG</p>
          <Button type="button" className="rounded-full" disabled={isUploading}>
            {isUploading ? 'Đang upload..' : 'Chọn ảnh từ máy tính'}
          </Button>
        </div>
      )}
    </div>
  )
}