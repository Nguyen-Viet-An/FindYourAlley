'use client'

import { useCallback, useState } from 'react'
import type { FileWithPath } from 'react-dropzone'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import imageCompression from 'browser-image-compression'

type FileUploaderProps = {
  onFieldChange: (url: string) => void
  imageUrl: string
  setFiles: (files: File[]) => void 
}

export function FileUploader({ imageUrl, onFieldChange, setFiles }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length === 0) return

    setFiles(acceptedFiles as File[])
    let file = acceptedFiles[0]

    try {
      setIsUploading(true)

      // Compress image if it's too large (>8MB)
      if (file.size > 8 * 1024 * 1024) {
        const options = {
          maxSizeMB: 8,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/jpeg',
          quality: 0.8,
        }
        file = await imageCompression(file, options)
      }

      // Preview before upload
      const previewUrl = URL.createObjectURL(file)
      onFieldChange(previewUrl)

      // Upload directly to your Next.js route
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData, // no JSON, just FormData
      })

      if (!res.ok) throw new Error('Upload failed')

      const { fileUrl } = await res.json()
      onFieldChange(fileUrl)

    } catch (error) {
      console.error('Error uploading file to R2:', error)
    } finally {
      setIsUploading(false)
    }
  }, [onFieldChange, setFiles])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.svg'] },
    maxFiles: 1,
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
          <img src="/assets/icons/upload.svg" width={77} height={77} alt="file upload" />
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
