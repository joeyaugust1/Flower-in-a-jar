# Flower in a Jar - Text-Based Personality Preservation

## Core Purpose & Success
- **Mission Statement**: Create AI personality clones from written text to enable meaningful conversations with preserved personalities
- **Success Indicators**: Users can upload text content and have natural, authentic conversations that feel like talking to the real person
- **Experience Qualities**: Intimate, Respectful, Authentic

## Project Classification & Approach
- **Complexity Level**: Light Application (text processing, AI conversation, profile management)
- **Primary User Activity**: Creating (personality profiles) and Interacting (conversations)

## Thought Process for Feature Selection
- **Core Problem Analysis**: People want to preserve and interact with personalities of loved ones through written communication they've shared
- **User Context**: Memorial conversations, personality preservation, continuing connections through AI
- **Critical Path**: Profile creation → Text upload → AI conversation readiness → Natural chat interface
- **Key Moments**: First meaningful AI response that captures personality, successful text upload processing

## Essential Features

### Profile Management
- **Functionality**: Create and manage personality profiles with names, photos, consent status
- **Purpose**: Organize different personalities and track training progress
- **Success Criteria**: Users can easily create, select, and manage multiple profiles

### Text Content Upload
- **Functionality**: Batch upload text messages, emails, chat logs, letters, or any written content
- **Purpose**: Train AI personality from authentic written communication style and content
- **Success Criteria**: Text processes successfully and contributes to personality training progress

### Conversation Interface
- **Functionality**: Real-time chat with AI personality clone trained on uploaded text
- **Purpose**: Enable meaningful conversations that feel authentic to the preserved personality
- **Success Criteria**: Responses feel natural, contextual, and true to the personality

### Training Progress Dashboard
- **Functionality**: Visual feedback on personality training completeness and readiness
- **Purpose**: Guide users through the training process and indicate when conversations are ready
- **Success Criteria**: Clear progress indication and seamless transition to conversation mode

## Design Direction

### Visual Tone & Identity
- **Emotional Response**: Warm nostalgia, gentle comfort, respectful reverence
- **Design Personality**: Elegant, soft, organic - like a pressed flower preserved in a book
- **Visual Metaphors**: Pressed flowers, vintage letters, memory preservation, organic textures
- **Simplicity Spectrum**: Minimal interface that lets emotional content breathe

### Color Strategy
- **Color Scheme Type**: Analogous (warm, organic palette)
- **Primary Color**: Soft lavender (`oklch(0.75 0.15 310)`) - gentle, memorable, comforting
- **Secondary Colors**: Light cream (`oklch(0.90 0.05 80)`) - subtle background warmth
- **Accent Color**: Golden amber (`oklch(0.80 0.18 60)`) - highlighting important actions
- **Color Psychology**: Soft, nurturing colors that evoke comfort and preservation without being clinical
- **Color Accessibility**: All pairings meet WCAG AA contrast requirements
- **Foreground/Background Pairings**:
  - Background (cream): Charcoal text `oklch(0.25 0.01 270)`
  - Card (white): Charcoal text `oklch(0.25 0.01 270)`
  - Primary (lavender): White text `oklch(1 0 0)`
  - Secondary (cream): Charcoal text `oklch(0.25 0.01 270)`
  - Accent (amber): Charcoal text `oklch(0.25 0.01 270)`
  - Muted (light cream): Medium gray text `oklch(0.50 0.02 270)`

### Typography System
- **Font Pairing Strategy**: Single typeface (Inter) with careful weight and size variation
- **Typographic Hierarchy**: Clear distinction between headers, body text, and metadata
- **Font Personality**: Clean, readable, warm without being overly stylized
- **Readability Focus**: Generous line spacing, comfortable reading lengths
- **Typography Consistency**: Consistent spacing and sizing scale throughout
- **Which fonts**: Inter (400, 500, 600 weights)
- **Legibility Check**: Inter provides excellent screen readability across all sizes

### Visual Hierarchy & Layout
- **Attention Direction**: Progressive disclosure from profile creation to conversation
- **White Space Philosophy**: Generous padding creates breathing room for emotional content
- **Grid System**: Responsive grid with consistent spacing and alignment
- **Responsive Approach**: Mobile-first with thoughtful desktop enhancement
- **Content Density**: Balanced information without overwhelming users

### Animations
- **Purposeful Meaning**: Subtle transitions that guide users through emotional journey
- **Hierarchy of Movement**: Focus on message sending/receiving and progress updates
- **Contextual Appropriateness**: Gentle, respectful animations that enhance without distracting

### UI Elements & Component Selection
- **Component Usage**: 
  - Cards for content grouping and personality profiles
  - Tabs for organizing upload vs conversation
  - Textarea for text input
  - Progress bars for training status
  - ScrollArea for conversation history
- **Component Customization**: Organic shadows, rounded corners, soft color applications
- **Component States**: Clear hover, focus, and disabled states with gentle transitions
- **Icon Selection**: Phosphor icons with appropriate weight and semantic meaning
- **Component Hierarchy**: Primary actions (send message) vs secondary (profile management)
- **Spacing System**: Consistent use of Tailwind's spacing scale
- **Mobile Adaptation**: Stack layouts, touch-friendly sizing, readable text

### Visual Consistency Framework
- **Design System Approach**: Component-based with consistent styling patterns
- **Style Guide Elements**: Color usage, spacing, typography, shadow application
- **Visual Rhythm**: Repeating patterns in card layouts and spacing
- **Brand Alignment**: Organic, memory-focused visual language throughout

### Accessibility & Readability
- **Contrast Goal**: WCAG AA compliance minimum for all text and interactive elements

## Edge Cases & Problem Scenarios
- **Potential Obstacles**: Insufficient text for personality training, unclear upload formats
- **Edge Case Handling**: Clear guidance on text requirements, fallback responses during AI failures
- **Technical Constraints**: AI response quality depends on training text quantity and quality

## Implementation Considerations
- **Scalability Needs**: Support for multiple profiles and large text datasets
- **Testing Focus**: AI response quality, text processing reliability, conversation flow
- **Critical Questions**: How much text is needed for authentic personalities? How to handle sensitive content?

## Reflection
- This text-focused approach makes personality preservation more accessible than audio recording
- The intimate nature of written communication may actually capture personality better than voice alone
- Success depends on creating conversations that feel genuinely authentic rather than robotic