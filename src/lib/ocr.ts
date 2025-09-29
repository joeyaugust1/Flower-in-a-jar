import Tesseract from 'tesseract.js'

interface OCROptions {
  onProgress?: (progress: number) => void
  language?: string
}

/**
 * Extract text from an image file using Tesseract.js OCR
 */
export async function extractTextFromImage(
  imageFile: File, 
  options: OCROptions = {}
): Promise<string> {
  const { onProgress, language = 'eng' } = options

  try {
    const result = await Tesseract.recognize(
      imageFile,
      language,
      {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(Math.round(m.progress * 100))
          }
        }
      }
    )

    return result.data.text || ''
  } catch (error) {
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Process extracted text to filter chat messages based on position
 * This is a basic heuristic approach for filtering chat bubble content
 */
export function processExtractedText(rawText: string, position: 'left' | 'right'): string {
  if (!rawText || rawText.trim() === '') return ''
  
  // Split text into lines and process each line
  const lines = rawText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  const filteredLines: string[] = []
  
  for (const line of lines) {
    // Skip very short lines (likely UI elements)
    if (line.length < 3) continue
    
    // Skip lines that are likely timestamps or usernames
    if (/^\d{1,2}:\d{2}/.test(line)) continue // Time stamps like "2:30"
    if (/^(AM|PM)$/i.test(line)) continue // AM/PM indicators
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(line)) continue // Dates
    if (line.match(/^[A-Za-z]+\s*$/)) continue // Single words (likely usernames)
    if (line.match(/^(Today|Yesterday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i)) continue
    
    // Skip common UI elements
    if (line.match(/^(Delivered|Read|Seen|Online|Active|Typing)$/i)) continue
    if (line.match(/^(Call|Video|Voice|Photo|Sticker|GIF)$/i)) continue
    
    // Include lines that look like actual message content
    if (line.length > 3 && !line.match(/^[^a-zA-Z]*$/)) {
      filteredLines.push(line)
    }
  }
  
  return filteredLines.join('\n')
}

/**
 * Preprocess image to improve OCR accuracy
 */
export function preprocessImageForOCR(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = document.createElement('img')
    
    img.onload = () => {
      try {
        // Set canvas dimensions to match image
        canvas.width = img.width
        canvas.height = img.height
        
        if (ctx) {
          // Draw original image
          ctx.drawImage(img, 0, 0)
          
          // Get image data for processing
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data
          
          // Simple contrast enhancement
          for (let i = 0; i < data.length; i += 4) {
            // Convert to grayscale for better OCR
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
            
            // Enhance contrast
            const enhanced = gray < 128 ? Math.max(0, gray - 30) : Math.min(255, gray + 30)
            
            data[i] = enhanced     // Red
            data[i + 1] = enhanced // Green
            data[i + 2] = enhanced // Blue
            // Alpha channel stays the same
          }
          
          // Put processed image data back
          ctx.putImageData(imageData, 0, 0)
          
          // Convert to blob and then to file
          canvas.toBlob((blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, { type: 'image/png' })
              resolve(processedFile)
            } else {
              reject(new Error('Failed to process image'))
            }
          }, 'image/png')
        } else {
          reject(new Error('Could not get canvas context'))
        }
      } catch (error) {
        reject(new Error(`Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    
    // Load original image
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string
      } else {
        reject(new Error('Failed to read image data'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}