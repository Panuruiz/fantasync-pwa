/**
 * Security utilities for sanitizing user input and rich text content
 * Prevents XSS attacks and enforces content policies
 */

// Allowed HTML tags for rich text content
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'a', 'span', 'div'
] as const

// Allowed attributes for specific tags
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'target', 'rel'],
  span: ['class', 'style'],
  div: ['class', 'style'],
  code: ['class'],
  pre: ['class'],
}

// Allowed CSS properties for style attributes
const ALLOWED_STYLES = [
  'color', 'background-color', 'font-size', 'font-weight',
  'font-style', 'text-decoration', 'text-align',
  'margin', 'padding', 'border'
] as const

// URL schemes allowed in href attributes
const ALLOWED_URL_SCHEMES = ['http', 'https', 'mailto'] as const

// Maximum content length (characters)
const MAX_CONTENT_LENGTH = 50000 // 50k characters

// File upload constraints
export const FILE_UPLOAD_LIMITS = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedDocumentTypes: ['application/pdf', 'text/plain', 'text/markdown'],
  maxFilesPerUpload: 5,
  maxTotalUploadSize: 20 * 1024 * 1024, // 20MB total
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous tags, attributes, and JavaScript
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  
  // Enforce maximum length
  if (html.length > MAX_CONTENT_LENGTH) {
    html = html.substring(0, MAX_CONTENT_LENGTH)
  }
  
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  
  // Recursively clean all elements
  sanitizeElement(tempDiv)
  
  return tempDiv.innerHTML
}

/**
 * Recursively sanitize DOM elements
 */
function sanitizeElement(element: Element): void {
  // Get all child elements
  const children = Array.from(element.children)
  
  for (const child of children) {
    const tagName = child.tagName.toLowerCase()
    
    // Remove disallowed tags
    if (!ALLOWED_TAGS.includes(tagName as any)) {
      // Move children up to parent before removing the element
      while (child.firstChild) {
        element.insertBefore(child.firstChild, child)
      }
      child.remove()
      continue
    }
    
    // Clean attributes
    const allowedAttrs = ALLOWED_ATTRIBUTES[tagName] || []
    const attributes = Array.from(child.attributes)
    
    for (const attr of attributes) {
      if (!allowedAttrs.includes(attr.name)) {
        child.removeAttribute(attr.name)
      } else {
        // Sanitize attribute values
        if (attr.name === 'href') {
          const url = sanitizeUrl(attr.value)
          if (url) {
            child.setAttribute('href', url)
          } else {
            child.removeAttribute('href')
          }
        } else if (attr.name === 'style') {
          const styles = sanitizeStyles(attr.value)
          if (styles) {
            child.setAttribute('style', styles)
          } else {
            child.removeAttribute('style')
          }
        }
      }
    }
    
    // Add security attributes to links
    if (tagName === 'a') {
      child.setAttribute('rel', 'noopener noreferrer')
      if (child.getAttribute('target') === '_blank') {
        // Keep target="_blank" but ensure rel is set
      } else {
        child.removeAttribute('target')
      }
    }
    
    // Recursively clean children
    sanitizeElement(child)
  }
}

/**
 * Sanitize URL to prevent JavaScript and data URIs
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null
  
  try {
    const parsed = new URL(url, window.location.href)
    const scheme = parsed.protocol.slice(0, -1) // Remove trailing colon
    
    if (ALLOWED_URL_SCHEMES.includes(scheme as any)) {
      return parsed.href
    }
    
    return null
  } catch {
    // Invalid URL
    return null
  }
}

/**
 * Sanitize CSS styles to prevent injection
 */
export function sanitizeStyles(styles: string): string {
  if (!styles) return ''
  
  const declarations = styles.split(';').filter(Boolean)
  const sanitized: string[] = []
  
  for (const declaration of declarations) {
    const [property, value] = declaration.split(':').map(s => s.trim())
    
    if (property && value && ALLOWED_STYLES.includes(property as any)) {
      // Basic validation of CSS values (prevent url() and expression())
      if (!value.includes('url(') && !value.includes('expression(')) {
        sanitized.push(`${property}: ${value}`)
      }
    }
  }
  
  return sanitized.join('; ')
}

/**
 * Sanitize plain text input (removes all HTML)
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (!text) return ''
  
  // Remove all HTML tags
  const cleaned = text.replace(/<[^>]*>/g, '')
  
  // Normalize whitespace
  const normalized = cleaned.replace(/\s+/g, ' ').trim()
  
  // Enforce max length
  if (normalized.length > maxLength) {
    return normalized.substring(0, maxLength)
  }
  
  return normalized
}

/**
 * Validate file upload constraints
 */
export function validateFileUpload(
  file: File,
  type: 'image' | 'document' = 'image'
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > FILE_UPLOAD_LIMITS.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds ${FILE_UPLOAD_LIMITS.maxFileSize / 1024 / 1024}MB limit`
    }
  }
  
  // Check file type
  const allowedTypes = type === 'image' 
    ? FILE_UPLOAD_LIMITS.allowedImageTypes
    : FILE_UPLOAD_LIMITS.allowedDocumentTypes
    
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`
    }
  }
  
  // Additional validation for images
  if (type === 'image') {
    // Check for valid image extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!validExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'Invalid image file extension'
      }
    }
  }
  
  return { valid: true }
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = filename.split(/[\\/]/).pop() || 'file'
  
  // Replace dangerous characters
  const sanitized = basename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255) // Max filename length
    
  // Ensure it has an extension
  if (!sanitized.includes('.')) {
    return sanitized + '.txt'
  }
  
  return sanitized
}

/**
 * Create a content security policy for rich text editors
 */
export function getContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Allow inline scripts for editor
    "style-src 'self' 'unsafe-inline'", // Allow inline styles
    "img-src 'self' data: https:", // Allow images from self, data URIs, and HTTPS
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'", // Prevent clickjacking
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
}

/**
 * Escape HTML entities for display in text
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}