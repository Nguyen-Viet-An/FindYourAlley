'use client'

import { useCallback, Dispatch, SetStateAction, useState } from 'react'
import type { FileWithPath } from 'react-dropzone'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { convertFileToUrl } from '@/lib/utils'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebaseConfig'

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
    
    // Create a temporary preview URL
    const previewUrl = convertFileToUrl(acceptedFiles[0])
    onFieldChange(previewUrl)
    
    try {
      setIsUploading(true)
      
      // Upload to Firebase
      const file = acceptedFiles[0]
      
      // Create a unique filename (timestamp + original name)
      const timestamp = new Date().getTime()
      const uniqueFileName = `${timestamp}-${file.name}`
      
      // Create a reference to the file location in Firebase Storage
      const storageRef = ref(storage, `images/${uniqueFileName}`)
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file)
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      // Update form with the downloadURL
      onFieldChange(downloadURL)
    } catch (error) {
      console.error('Error uploading file:', error)
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