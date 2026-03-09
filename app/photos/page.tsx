'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Photo } from '@/lib/types'
import ImageCropper from '@/components/ImageCropper'

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [caption, setCaption] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [cropSrc, setCropSrc] = useState('')
  const [croppedFile, setCroppedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchPhotos()
  }, [])

  async function fetchPhotos() {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })
    setPhotos(data ?? [])
    setLoading(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setCropSrc(URL.createObjectURL(file))
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleCropConfirm(blob: Blob) {
    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
    setCroppedFile(file)
    setPreviewUrl(URL.createObjectURL(blob))
    setCropSrc('')
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = croppedFile
    if (!file) return

    setUploading(true)
    try {
      const path = `${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, file)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)

      const { error: dbError } = await supabase
        .from('photos')
        .insert({ url: urlData.publicUrl, caption: caption || null })
      if (dbError) throw dbError

      setCaption('')
      setPreviewUrl('')
      setCroppedFile(null)
      setShowUpload(false)
      await fetchPhotos()
    } catch (err) {
      console.error(err)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(photo: Photo) {
    if (!confirm('Delete this photo?')) return
    const pathMatch = photo.url.match(/\/photos\/(.+)$/)
    if (pathMatch) {
      await supabase.storage.from('photos').remove([pathMatch[1]])
    }
    await supabase.from('photos').delete().eq('id', photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
  }

  return (
    <>
    {cropSrc && (
      <ImageCropper
        src={cropSrc}
        aspect={4 / 3}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropSrc('')}
      />
    )}
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Family Photos</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowUpload(v => !v)}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          + Upload Photo
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
          <h2 className="font-semibold text-slate-800 mb-5">Upload New Photo</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="flex gap-6 items-start">
              {previewUrl && (
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Photo</label>
                  {croppedFile ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-600">{croppedFile.name}</span>
                      <label className="text-sm text-amber-600 hover:text-amber-700 cursor-pointer font-medium">
                        Change
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  ) : (
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Caption (optional)
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={uploading || !croppedFile}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpload(false)
                  setPreviewUrl('')
                  setCroppedFile(null)
                }}
                className="text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="text-center py-32 text-slate-400">Loading photos...</div>
      ) : photos.length === 0 ? (
        <div className="text-center py-32 text-slate-400">
          <p className="text-xl mb-2">No photos yet</p>
          <p className="text-sm">Upload your first family photo to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map(photo => (
            <div
              key={photo.id}
              className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 aspect-square"
            >
              <img
                src={photo.url}
                alt={photo.caption ?? 'Family photo'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex flex-col justify-end">
                <div className="p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                  {photo.caption && (
                    <p className="text-white text-xs font-medium mb-2 line-clamp-2">
                      {photo.caption}
                    </p>
                  )}
                  <button
                    onClick={() => handleDelete(photo)}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
    </>
  )
}
