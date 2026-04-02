'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { FileWithPath } from 'react-dropzone'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import imageCompression from 'browser-image-compression'

type FileUploaderProps = {
  onFieldChange: (url: string) => void
  imageUrl: string
  setFiles: (files: File[]) => void
}

// Function to sanitize filename
const sanitizeFilename = (filename: string): string => {
  // Get the file extension
  const lastDotIndex = filename.lastIndexOf('.')
  const name = lastDotIndex !== -1 ? filename.slice(0, lastDotIndex) : filename
  const ext = lastDotIndex !== -1 ? filename.slice(lastDotIndex) : ''

  // Replace spaces and special characters with underscores
  const sanitizedName = name
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .replace(/[^\w\-_.]/g, '_')     // Replace special chars with underscores
    .replace(/_+/g, '_')            // Replace multiple underscores with single
    .replace(/^_|_$/g, '')          // Remove leading/trailing underscores

  // Add timestamp to make it unique
  const timestamp = Date.now()

  return `${sanitizedName}_${timestamp}${ext}`
}

export function FileUploader({ imageUrl, onFieldChange, setFiles }: FileUploaderProps) {
  const t = useTranslations('fileUpload')
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length === 0) return

    setFiles(acceptedFiles as File[])
    let file = acceptedFiles[0]

    try {
      setIsUploading(true)

      // Compress image if it's too large (>4MB, Vercel body limit is 4.5MB)
      if (file.size > 4 * 1024 * 1024) {
        const options = {
          maxSizeMB: 4,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/jpeg',
          quality: 0.8,
        }
        file = await imageCompression(file, options)
      }

      // Sanitize filename and create new File object
      const sanitizedFilename = sanitizeFilename(file.name)
      const sanitizedFile = new File([file], sanitizedFilename, {
        type: file.type,
        lastModified: file.lastModified,
      })

      // Preview before upload
      const previewUrl = URL.createObjectURL(sanitizedFile)
      onFieldChange(previewUrl)

      // Retry logic for upload
      let uploadSuccess = false
      let retryCount = 0
      const maxRetries = 3

      while (!uploadSuccess && retryCount < maxRetries) {
        try {
          const formData = new FormData()
          formData.append('file', sanitizedFile) // Use sanitized file

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
      className="flex-center bg-dark-3 flex h-full min-h-[12rem] cursor-pointer flex-col overflow-hidden rounded-xl bg-grey-50 dark:bg-muted"
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
              <div className="text-white">{t('uploading')}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-center flex-col py-3 text-grey-500 dark:text-muted-foreground">
          <img src="/assets/icons/upload.svg" width={48} height={48} alt="file upload" />
          <h3 className="mb-1 mt-1 text-sm">{t('dropHere')}</h3>
          <p className="text-xs mb-2">PNG, JPG</p>
          <Button type="button" size="sm" className="rounded-full" disabled={isUploading}>
            {isUploading ? t('uploadingShort') : t('selectFromComputer')}
          </Button>
        </div>
      )}
    </div>
  )
}