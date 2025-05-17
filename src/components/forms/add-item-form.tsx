import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const itemSchema = z.object({
  def_index: z.coerce.number().int().min(0),
  def_name: z.string().min(1, 'Definition name is required'),
  paint_index: z.coerce.number().int().nullable(),
  paint_name: z.string().nullable(),
  max_float: z.coerce.number().min(0).max(1).nullable(),
  min_float: z.coerce.number().min(0).max(1).nullable(),
  category: z.coerce.number().int().min(0).max(3),
  market_hash_name: z.string().nullable(),
})

type ItemFormValues = z.infer<typeof itemSchema>

// Function to get wear category name based on float value
function getWearName(floatValue: number | null): string {
  if (floatValue === null) return '';
  
  if (floatValue < 0.07) return 'Factory New';
  if (floatValue < 0.15) return 'Minimal Wear';
  if (floatValue < 0.38) return 'Field-Tested';
  if (floatValue < 0.45) return 'Well-Worn';
  return 'Battle-Scarred';
}

export function AddItemForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const supabase = createClient()
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      category: 0,
    },
  })

  // Watch the required fields for auto-generating market hash name
  const defName = useWatch({ control, name: 'def_name' });
  const paintName = useWatch({ control, name: 'paint_name' });
  const minFloat = useWatch({ control, name: 'min_float' });
  
  // Generate market hash name whenever dependent fields change
  useEffect(() => {
    if (!defName) return;
    
    let hashName = defName;
    
    // Add paint name if available
    if (paintName) {
      hashName += ` | ${paintName}`;
    }
    
    // Add wear condition if min_float is specified
    if (minFloat !== null && minFloat !== undefined) {
      const wearName = getWearName(minFloat);
      if (wearName) {
        hashName += ` (${wearName})`;
      }
    }
    
    setValue('market_hash_name', hashName);
  }, [defName, paintName, minFloat, setValue]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setImageFile(file)
    
    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (data: ItemFormValues) => {
    try {
      setIsLoading(true)
      
      let imageUrl = null
      
      // Upload image to Supabase Storage if exists
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cs-items-images')
          .upload(fileName, imageFile)
          
        if (uploadError) throw uploadError
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('cs-items-images')
          .getPublicUrl(fileName)
          
        imageUrl = publicUrl
      }
      
      // Generate market hash name if not already set
      if (!data.market_hash_name && data.def_name) {
        let hashName = data.def_name;
        
        if (data.paint_name) {
          hashName += ` | ${data.paint_name}`;
        }
        
        if (data.min_float !== null) {
          const wearName = getWearName(data.min_float);
          if (wearName) {
            hashName += ` (${wearName})`;
          }
        }
        
        data.market_hash_name = hashName;
      }
      
      // Insert the item data
      const { error } = await supabase.from('cs_items').insert({
        ...data,
        image_url: imageUrl,
      })
      
      if (error) throw error
      
      // Reset form and state on success
      reset()
      setImageFile(null)
      setImagePreview(null)
      onSuccess()
      
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Failed to add item. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Definition Index*</label>
          <input
            type="number"
            {...register('def_index')}
            className="w-full p-2 border rounded"
          />
          {errors.def_index && (
            <p className="text-red-500 text-xs mt-1">{errors.def_index.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Definition Name*</label>
          <input
            type="text"
            {...register('def_name')}
            className="w-full p-2 border rounded"
          />
          {errors.def_name && (
            <p className="text-red-500 text-xs mt-1">{errors.def_name.message}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Paint Index</label>
          <input
            type="number"
            {...register('paint_index')}
            className="w-full p-2 border rounded"
          />
          {errors.paint_index && (
            <p className="text-red-500 text-xs mt-1">{errors.paint_index.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Paint Name</label>
          <input
            type="text"
            {...register('paint_name')}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-sm mb-2">Wear Categories:</div>
        <div className="grid grid-cols-5 gap-2 mb-3 text-xs">
          <div className="text-center p-1 bg-green-100 rounded">
            <span className="text-green-500 font-medium">FN</span>
            <div>0.00-0.07</div>
          </div>
          <div className="text-center p-1 bg-green-50 rounded">
            <span className="text-green-400 font-medium">MW</span>
            <div>0.07-0.15</div>
          </div>
          <div className="text-center p-1 bg-yellow-50 rounded">
            <span className="text-yellow-500 font-medium">FT</span>
            <div>0.15-0.38</div>
          </div>
          <div className="text-center p-1 bg-orange-50 rounded">
            <span className="text-orange-500 font-medium">WW</span>
            <div>0.38-0.45</div>
          </div>
          <div className="text-center p-1 bg-red-50 rounded">
            <span className="text-red-500 font-medium">BS</span>
            <div>0.45-1.00</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Min Float</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            {...register('min_float')}
            className="w-full p-2 border rounded"
          />
          {errors.min_float && (
            <p className="text-red-500 text-xs mt-1">{errors.min_float.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Max Float</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            {...register('max_float')}
            className="w-full p-2 border rounded"
          />
          {errors.max_float && (
            <p className="text-red-500 text-xs mt-1">{errors.max_float.message}</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          {...register('category')}
          className="w-full p-2 border rounded"
        >
          <option value="0">0 - Weapon</option>
          <option value="1">1 - Knife</option>
          <option value="2">2 - Glove</option>
          <option value="3">3 - Other</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Market Hash Name (Auto-generated)</label>
        <input
          type="text"
          {...register('market_hash_name')}
          className="w-full p-2 border rounded bg-gray-50"
          readOnly
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full p-2 border rounded"
        />
        
        {imagePreview && (
          <div className="mt-2">
            <img src={imagePreview} alt="Preview" className="h-24 object-contain" />
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={() => {
            reset()
            setImageFile(null)
            setImagePreview(null)
          }}
          className="px-4 py-2 border rounded"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          disabled={isLoading}
        >
          {isLoading ? 'Adding...' : 'Add Item'}
        </button>
      </div>
    </form>
  )
} 