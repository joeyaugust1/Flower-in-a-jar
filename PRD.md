# FLOWER IN A JAR - Product Requirements Document

An intimate AI companion app that preserves and recreates the voices and personalities of loved ones through advanced voice cloning technology.

**Experience Qualities**:
1. **Intimate** - Creating deeply personal connections through familiar voices and mannerisms
2. **Respectful** - Handling precious memories and personal data with utmost care and consent
3. **Magical** - Transforming recordings into living conversations that feel authentically human

**Complexity Level**: Complex Application (advanced functionality, accounts)
- Advanced voice processing, personality analysis, and real-time conversation generation requiring sophisticated state management and user profiles.

## Essential Features

### Voice Recording Upload
- **Functionality**: Upload unlimited audio files of any length in common formats (MP3, WAV, M4A)
- **Purpose**: Collect voice samples to train the AI personality clone
- **Trigger**: User clicks upload button or drags files into upload zone
- **Progression**: File selection → Upload progress → Processing status → Sample added to collection
- **Success criteria**: Files upload successfully, processing completes, voice samples are stored and analyzed

### Personality Training Dashboard
- **Functionality**: Track training progress, view uploaded samples, and monitor clone readiness
- **Purpose**: Give users visibility into the cloning process and when conversations become available
- **Trigger**: User navigates to dashboard after uploading samples
- **Progression**: Dashboard load → Display sample count → Show training progress → Indicate readiness status
- **Success criteria**: Clear progress indicators, accurate sample counting, obvious readiness state

### AI Conversation Interface
- **Functionality**: Real-time voice and text conversations with the cloned personality
- **Purpose**: Enable meaningful interactions with the recreated personality
- **Trigger**: User initiates conversation when clone is ready
- **Progression**: Conversation start → User input (voice/text) → AI processing → Cloned response → Continued dialogue
- **Success criteria**: Natural conversation flow, voice similarity, personality consistency

### Profile Management
- **Functionality**: Create and manage multiple personality profiles with metadata
- **Purpose**: Organize different people's voice clones and maintain consent records
- **Trigger**: User creates new profile or manages existing ones
- **Progression**: Profile creation → Name/photo setup → Recording association → Settings configuration
- **Success criteria**: Multiple profiles supported, clear organization, consent tracking

## Edge Case Handling
- **Insufficient Training Data**: Clear messaging about minimum requirements and sample quality
- **Poor Audio Quality**: Automatic quality detection with improvement suggestions
- **Storage Limits**: Graceful handling with compression and cleanup options
- **Processing Failures**: Retry mechanisms with clear error explanations
- **Consent Revocation**: Immediate data deletion and clone deactivation

## Design Direction
The design should feel tender and reverent, like handling precious memories in a digital jewelry box - elegant, intimate, and deeply respectful of the emotional weight of preserving someone's voice and personality.

## Color Selection
Custom palette - A warm, organic palette inspired by pressed flowers and vintage photography that evokes memory, tenderness, and timeless connection.

- **Primary Color**: Soft Lavender (oklch(0.75 0.15 310)) - Communicates gentleness and emotional depth
- **Secondary Colors**: Warm cream (oklch(0.95 0.02 80)) for backgrounds, muted rose (oklch(0.70 0.12 20)) for accents
- **Accent Color**: Golden amber (oklch(0.80 0.18 60)) for important actions and progress indicators
- **Foreground/Background Pairings**: 
  - Background (Warm Cream oklch(0.95 0.02 80)): Charcoal text (oklch(0.25 0.01 270)) - Ratio 12.8:1 ✓
  - Card (White oklch(1 0 0)): Charcoal text (oklch(0.25 0.01 270)) - Ratio 16.5:1 ✓
  - Primary (Soft Lavender oklch(0.75 0.15 310)): White text (oklch(1 0 0)) - Ratio 5.2:1 ✓
  - Accent (Golden Amber oklch(0.80 0.18 60)): Charcoal text (oklch(0.25 0.01 270)) - Ratio 8.9:1 ✓

## Font Selection
Typography should feel warm and personal, like handwritten letters - elegant but approachable, with excellent readability for emotional content.

- **Typographic Hierarchy**:
  - H1 (App Title): Inter Medium/32px/tight tracking for main headings
  - H2 (Profile Names): Inter Regular/24px/normal tracking for personality names  
  - Body (Interface): Inter Regular/16px/relaxed line-height for comfortable reading
  - Small (Metadata): Inter Medium/14px/wide tracking for timestamps and details

## Animations
Animations should feel organic and gentle, like flower petals floating or memories surfacing - never jarring, always purposeful in guiding emotional moments.

- **Purposeful Meaning**: Gentle fades and organic movements that respect the emotional nature of the content
- **Hierarchy of Movement**: Upload progress flows like filling a vessel, conversation bubbles emerge like thoughts, profile transitions feel like turning pages

## Component Selection
- **Components**: Cards for profiles, Progress for training status, Dialog for conversations, Tabs for navigation, Alert for consent confirmations
- **Customizations**: Custom audio waveform visualizer, floating conversation bubbles, organic loading animations
- **States**: Upload zones with gentle hover states, disabled conversations until ready, progress indicators with organic animations  
- **Icon Selection**: Heart for favorites, Mic for recording, User for profiles, MessageCircle for conversations
- **Spacing**: Generous padding (p-8) for cards, comfortable margins (space-y-6) for emotional breathing room
- **Mobile**: Conversation interface optimized for voice input, simplified upload flow, swipe navigation between profiles