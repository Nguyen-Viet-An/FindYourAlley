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

      // Retry logic for upload
      let uploadSuccess = false
      let retryCount = 0
      const maxRetries = 3

      while (!uploadSuccess && retryCount < maxRetries) {
        try {
          const formData = new FormData()
          formData.append('file', file)

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            // Add timeout
            signal: AbortSignal.timeout(30000) // 30 second timeout
          })

          if (!res.ok) {
            throw new Error(`Đăng ảnh không thành công: ${res.status}`)
          }

          const { fileUrl } = await res.json()
          
          if (!fileUrl) {
            throw new Error('Không có link ảnh')
          }

          // Success - replace preview with real URL
          onFieldChange(fileUrl)
          uploadSuccess = true

        } catch (error) {
          retryCount++
          console.log(`Đăng ảnh lần ${retryCount} thất bại:`, error)
          
          if (retryCount < maxRetries) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          }
        }
      }

      if (!uploadSuccess) {
        // All retries failed - revert to no image
        onFieldChange('')
        alert('Đăng ảnh thất bại. Vui lòng thử lại.')
      }

    } catch (error) {
      console.error('Error in upload process:', error)
      // Revert to no image on compression or other errors
      onFieldChange('')
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
