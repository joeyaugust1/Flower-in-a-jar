import Tesseract from 'tesseract.js'

interface OCROptions {
  onProgress?: (progress: number) => void
  language?: string
  bubblePosition?: 'left' | 'right'
}

/**
 * Extract text from an image file using Tesseract.js OCR with advanced filtering
 */
export async function extractTextFromImage(
  imageFile: File, 
  options: OCROptions = {}
): Promise<string> {
  const { onProgress, language = 'eng', bubblePosition = 'left' } = options

  try {
    // Preprocess the image for better OCR accuracy
    const preprocessedFile = await preprocessImageForOCR(imageFile)
    
    const result = await Tesseract.recognize(
      preprocessedFile,
      language,
      {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(Math.round(m.progress * 100))
          }
        }
      }
    )

    // Try multiple filtering approaches for better accuracy
    let filteredText = ''
    
    // First, try word-level spatial filtering (most accurate)
    if (result.data && result.data.blocks && result.data.blocks.length > 0) {
      filteredText = filterTextByWords(result.data, bubblePosition)
    }
    
    // If word-level filtering didn't work well, try block-level filtering
    if ((!filteredText || filteredText.trim().length < 10) && result.data.blocks && result.data.blocks.length > 0) {
      filteredText = filterTextByBlocks(result.data.blocks, bubblePosition)
    } 
    
    // If spatial filtering didn't work well, fall back to text processing
    if (!filteredText || filteredText.trim().length < 10) {
      filteredText = processExtractedText(result.data.text || '', bubblePosition)
    }
    
    return filteredText
  } catch (error) {
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Filter OCR results based on chat bubble position using word-level analysis (most accurate)
 */
function filterTextByWords(data: any, position: 'left' | 'right'): string {
  try {
    const words: any[] = []
    
    // Extract all words from blocks/paragraphs/lines structure
    if (data.blocks) {
      for (const block of data.blocks) {
        if (block.paragraphs) {
          for (const paragraph of block.paragraphs) {
            if (paragraph.lines) {
              for (const line of paragraph.lines) {
                if (line.words) {
                  words.push(...line.words)
                }
              }
            }
          }
        }
      }
    }
    
    if (words.length === 0) return ''
    
    // Calculate image boundaries
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    
    for (const word of words) {
      if (word.bbox) {
        minX = Math.min(minX, word.bbox.x0)
        maxX = Math.max(maxX, word.bbox.x1) 
        minY = Math.min(minY, word.bbox.y0)
        maxY = Math.max(maxY, word.bbox.y1)
      }
    }
    
    const imageWidth = maxX - minX
    const imageHeight = maxY - minY
    
    if (imageWidth <= 0) return ''
    
    // More sophisticated filtering based on chat app layouts
    // Chat bubbles typically occupy specific regions of the screen
    const centerX = minX + (imageWidth / 2)
    
    // Define zones more precisely for chat bubbles
    // Left bubbles: typically 10-70% from left edge
    // Right bubbles: typically 30-90% from left edge
    const leftZoneStart = minX + (imageWidth * 0.1)   // 10% from left
    const leftZoneEnd = minX + (imageWidth * 0.7)     // 70% from left
    const rightZoneStart = minX + (imageWidth * 0.3)  // 30% from left  
    const rightZoneEnd = minX + (imageWidth * 0.9)    // 90% from left
    
    const filteredWords = words.filter(word => {
      if (!word.bbox || !word.text || word.text.trim().length === 0) return false
      
      const wordCenterX = (word.bbox.x0 + word.bbox.x1) / 2
      
      if (position === 'left') {
        // For left bubbles, include words in the left zone
        return wordCenterX >= leftZoneStart && wordCenterX <= leftZoneEnd
      } else {
        // For right bubbles, include words in the right zone
        return wordCenterX >= rightZoneStart && wordCenterX <= rightZoneEnd
      }
    })

    // Group words by lines for proper text reconstruction
    const lines = groupWordsByLines(filteredWords)
    
    // Extract text from filtered and grouped words
    const extractedText = lines
      .map(line => line.map(word => word.text || '').join(' '))
      .filter(line => line.trim().length > 0)
      .join('\n')
    
    // Apply additional text processing to clean up
    return processExtractedText(extractedText, position)
    
  } catch (error) {
    console.warn('Error in word filtering:', error)
    return ''
  }
}

/**
 * Filter OCR results based on chat bubble position using block analysis
 */
function filterTextByBlocks(blocks: any[], position: 'left' | 'right'): string {
  if (!blocks || blocks.length === 0) {
    return ''
  }

  try {
    // Calculate image boundaries from all blocks
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    
    for (const block of blocks) {
      if (block.bbox) {
        minX = Math.min(minX, block.bbox.x0)
        maxX = Math.max(maxX, block.bbox.x1)
        minY = Math.min(minY, block.bbox.y0)
        maxY = Math.max(maxY, block.bbox.y1)
      }
    }
    
    const imageWidth = maxX - minX
    const imageHeight = maxY - minY
    
    if (imageWidth <= 0) return ''
    
    // More precise zone detection for chat bubbles
    // Most chat apps have bubbles in these approximate zones:
    // - Left bubbles: 5-65% from left edge (other person)
    // - Right bubbles: 35-95% from left edge (user)
    const leftZoneStart = minX + (imageWidth * 0.05)   // 5% from left
    const leftZoneEnd = minX + (imageWidth * 0.65)     // 65% from left
    const rightZoneStart = minX + (imageWidth * 0.35)  // 35% from left
    const rightZoneEnd = minX + (imageWidth * 0.95)    // 95% from left
    
    // Filter blocks based on position
    const filteredBlocks = blocks.filter(block => {
      if (!block.bbox) return false
      
      const blockCenterX = (block.bbox.x0 + block.bbox.x1) / 2
      const blockWidth = block.bbox.x1 - block.bbox.x0
      const blockHeight = block.bbox.y1 - block.bbox.y0
      
      // Skip very small blocks (likely noise or UI elements)
      if (blockWidth < 20 || blockHeight < 15) return false
      
      // Position-based filtering
      if (position === 'left') {
        return blockCenterX >= leftZoneStart && blockCenterX <= leftZoneEnd
      } else {
        return blockCenterX >= rightZoneStart && blockCenterX <= rightZoneEnd
      }
    })

    // Extract text from filtered blocks and sort by vertical position
    const textBlocks: { text: string; y: number }[] = []
    
    for (const block of filteredBlocks) {
      if (block.paragraphs) {
        for (const paragraph of block.paragraphs) {
          if (paragraph.lines) {
            for (const line of paragraph.lines) {
              if (line.text && line.text.trim()) {
                const y = paragraph.bbox ? paragraph.bbox.y0 : 0
                textBlocks.push({ text: line.text.trim(), y })
              }
            }
          }
        }
      }
    }
    
    // Sort by vertical position (top to bottom) and extract text
    textBlocks.sort((a, b) => a.y - b.y)
    const extractedLines = textBlocks.map(block => block.text)
    
    return extractedLines.join('\n')
    
  } catch (error) {
    console.warn('Error in block filtering:', error)
    return ''
  }
}

/**
 * Filter OCR results based on chat bubble position using bounding box analysis
 */
function filterTextByPosition(words: any[], position: 'left' | 'right', fallbackText: string): string {
  if (!words || words.length === 0) {
    return processExtractedText(fallbackText, position)
  }

  try {
    // Calculate image width based on word positions
    const maxX = Math.max(...words.map(w => w.bbox?.x1 || 0))
    const imageWidth = maxX > 0 ? maxX : 1000 // fallback width
    
    // Define zones for left and right bubbles
    const leftZoneEnd = imageWidth * 0.65  // Left bubbles typically occupy left 65%
    const rightZoneStart = imageWidth * 0.35 // Right bubbles typically start from 35% 
    
    const filteredWords = words.filter(word => {
      if (!word.bbox) return false
      
      const centerX = (word.bbox.x0 + word.bbox.x1) / 2
      
      if (position === 'left') {
        // For left bubbles, include words in the left portion
        return centerX <= leftZoneEnd
      } else {
        // For right bubbles, include words in the right portion  
        return centerX >= rightZoneStart
      }
    })

    // Group words by lines (using y-coordinate)
    const lines = groupWordsByLines(filteredWords)
    
    // Extract text from filtered words
    const extractedText = lines
      .map(line => line.map(word => word.text).join(' '))
      .join('\n')
    
    // Apply additional text processing
    return processExtractedText(extractedText, position)
    
  } catch (error) {
    console.warn('Error in position filtering, falling back to text processing:', error)
    return processExtractedText(fallbackText, position)
  }
}

/**
 * Group words into lines based on their vertical position
 */
function groupWordsByLines(words: any[]): any[][] {
  if (!words || words.length === 0) return []
  
  // Sort words by vertical position (top to bottom)
  const sortedWords = [...words].sort((a, b) => {
    const aY = a.bbox ? (a.bbox.y0 + a.bbox.y1) / 2 : 0
    const bY = b.bbox ? (b.bbox.y0 + b.bbox.y1) / 2 : 0
    return aY - bY
  })
  
  const lines: any[][] = []
  let currentLine: any[] = []
  let lastY = -1
  const lineThreshold = 20 // pixels - adjust based on typical line spacing
  
  for (const word of sortedWords) {
    const wordY = word.bbox ? (word.bbox.y0 + word.bbox.y1) / 2 : 0
    
    if (lastY === -1 || Math.abs(wordY - lastY) <= lineThreshold) {
      // Same line
      currentLine.push(word)
    } else {
      // New line
      if (currentLine.length > 0) {
        // Sort current line by horizontal position (left to right)
        currentLine.sort((a, b) => {
          const aX = a.bbox ? a.bbox.x0 : 0
          const bX = b.bbox ? b.bbox.x0 : 0
          return aX - bX
        })
        lines.push(currentLine)
      }
      currentLine = [word]
    }
    lastY = wordY
  }
  
  // Don't forget the last line
  if (currentLine.length > 0) {
    currentLine.sort((a, b) => {
      const aX = a.bbox ? a.bbox.x0 : 0
      const bX = b.bbox ? b.bbox.x0 : 0
      return aX - bX
    })
    lines.push(currentLine)
  }
  
  return lines
}

/**
 * Process extracted text to filter chat messages based on position
 * Enhanced with better heuristics for chat app content
 */
export function processExtractedText(rawText: string, position: 'left' | 'right'): string {
  if (!rawText || rawText.trim() === '') return ''
  
  // Split text into lines and process each line
  const lines = rawText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  const filteredLines: string[] = []
  const seenMessages = new Set<string>() // Avoid duplicates
  
  for (const line of lines) {
    // Skip very short lines (likely UI elements)
    if (line.length < 2) continue
    
    // Skip lines that are likely timestamps or system messages
    if (/^\d{1,2}:\d{2}(\s?(AM|PM))?$/i.test(line)) continue // Time stamps like "2:30" or "2:30 PM"
    if (/^(AM|PM)$/i.test(line)) continue // AM/PM indicators
    if (/^\d{1,2}\/\d{1,2}(\/\d{2,4})?/.test(line)) continue // Dates like "12/25" or "12/25/2023"
    if (/^(Today|Yesterday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i.test(line)) continue
    if (/^\w{3},?\s+\w{3}\s+\d{1,2}/.test(line)) continue // "Mon, Dec 25" format
    
    // Skip single words that are likely usernames or UI elements
    if (line.match(/^[A-Za-z]{1,15}$/)) continue // Single words (likely usernames)
    if (line.match(/^[A-Za-z]{1,10}\s+[A-Za-z]{1,10}$/)) continue // Two words (likely full names)
    
    // Skip common messaging app UI elements
    if (line.match(/^(Delivered|Read|Seen|Online|Active|Typing|Offline)$/i)) continue
    if (line.match(/^(Call|Video|Voice|Photo|Sticker|GIF|Document|Location|Contact)$/i)) continue
    if (line.match(/^(You|Message|Chat|Conversation|Thread)$/i)) continue
    if (line.match(/^(Send|Reply|Forward|Delete|Edit|Copy)$/i)) continue
    if (/^\+\d{10,15}$/.test(line)) continue // Phone numbers
    
    // Skip reaction emojis and single characters
    if (line.match(/^[👍👎❤️😂😮😢😡🔥💯✨🎉🙏💕😍🥰😘🤔😊😁👏🤝👌💪🎊🎈]+$/)) continue
    if (line.length === 1 && line.match(/[^\w\s]/)) continue
    
    // Skip lines that are mostly numbers or symbols
    if (line.match(/^[0-9\s\-\+\(\)\.]{5,}$/)) continue // Phone numbers, dates, etc.
    if (line.match(/^[^\w\s]{3,}$/)) continue // Lines of symbols
    
    // Skip common placeholder texts
    if (line.match(/^(Start typing|Type a message|Message|Aa|Send)$/i)) continue
    if (line.match(/^(Loading|Please wait|Connecting)$/i)) continue
    
    // Skip very repetitive patterns (keyboard spam)
    if (/(.)\1{4,}/.test(line)) continue // 4+ repeated characters
    
    // Include lines that look like actual message content
    if (line.length >= 2) {
      // Must contain at least one letter
      if (/[a-zA-Z]/.test(line)) {
        // Remove duplicate messages (sometimes OCR picks up same text multiple times)
        const normalized = line.toLowerCase().replace(/\s+/g, ' ')
        if (!seenMessages.has(normalized)) {
          seenMessages.add(normalized)
          filteredLines.push(line)
        }
      }
    }
  }
  
  // Additional filtering: remove lines that are too similar to others (OCR artifacts)
  const uniqueLines: string[] = []
  
  for (const line of filteredLines) {
    let isDuplicate = false
    const lineWords = line.toLowerCase().split(/\s+/)
    
    for (const existingLine of uniqueLines) {
      const existingWords = existingLine.toLowerCase().split(/\s+/)
      
      // Check if lines are too similar (>80% word overlap)
      const intersection = lineWords.filter(word => existingWords.includes(word))
      const similarity = intersection.length / Math.max(lineWords.length, existingWords.length)
      
      if (similarity > 0.8 && Math.abs(lineWords.length - existingWords.length) <= 2) {
        isDuplicate = true
        break
      }
    }
    
    if (!isDuplicate) {
      uniqueLines.push(line)
    }
  }
  
  return uniqueLines.join('\n')
}

/**
 * Preprocess image to improve OCR accuracy with chat-specific enhancements
 */
export function preprocessImageForOCR(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = document.createElement('img')
    
    img.onload = () => {
      try {
        // Set canvas dimensions to match image (but scale down if too large for performance)
        const maxWidth = 1200
        const maxHeight = 1600
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const scaleX = maxWidth / width
          const scaleY = maxHeight / height
          const scale = Math.min(scaleX, scaleY)
          width = Math.floor(width * scale)
          height = Math.floor(height * scale)
        }
        
        canvas.width = width
        canvas.height = height
        
        if (ctx) {
          // Draw original image scaled
          ctx.drawImage(img, 0, 0, width, height)
          
          // Get image data for processing
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data
          
          // Advanced preprocessing for chat screenshots
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            
            // Convert to grayscale using luminance formula
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
            
            // Enhance contrast specifically for text
            // This makes dark text darker and light backgrounds lighter
            let enhanced = gray
            if (gray < 128) {
              // Darken dark pixels (text)
              enhanced = Math.max(0, Math.round(gray * 0.7))
            } else {
              // Lighten light pixels (backgrounds)
              enhanced = Math.min(255, Math.round(128 + (gray - 128) * 1.3))
            }
            
            // Apply threshold for better text recognition
            // This creates more distinct black text on white background
            if (enhanced < 100) {
              enhanced = 0  // Pure black for text
            } else if (enhanced > 200) {
              enhanced = 255  // Pure white for background
            }
            
            data[i] = enhanced     // Red
            data[i + 1] = enhanced // Green
            data[i + 2] = enhanced // Blue
            // Alpha channel stays the same
          }
          
          // Additional noise reduction pass
          const processedData = new Uint8ClampedArray(data.length)
          
          // Copy original data first
          for (let i = 0; i < data.length; i++) {
            processedData[i] = data[i]
          }
          
          // Simple median filter for noise reduction on text regions
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = (y * width + x) * 4
              
              // Get surrounding pixel values (grayscale)
              const neighbors: number[] = []
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  const nIdx = ((y + dy) * width + (x + dx)) * 4
                  neighbors.push(data[nIdx]) // Just red channel since it's grayscale
                }
              }
              
              // Use median value to reduce noise
              neighbors.sort((a, b) => a - b)
              const median = neighbors[4] // Middle value of 9 neighbors
              
              // Only apply median filter if there's significant noise
              const currentValue = data[idx]
              if (Math.abs(currentValue - median) > 20) {
                processedData[idx] = median     // Red
                processedData[idx + 1] = median // Green
                processedData[idx + 2] = median // Blue
              }
            }
          }
          
          // Put processed image data back
          const finalImageData = new ImageData(processedData, width, height)
          ctx.putImageData(finalImageData, 0, 0)
          
          // Convert to blob and then to file
          canvas.toBlob((blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, { type: 'image/png' })
              resolve(processedFile)
            } else {
              reject(new Error('Failed to process image'))
            }
          }, 'image/png', 0.95) // High quality PNG
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