# Cultural Tourism AI Guide

An AI-powered mobile app that recognizes cultural sites and monuments from photos, then generates personalized audio tour guides using Google Cloud Vision API.

## Features

- **Image Recognition**: Uses Google Cloud Vision API to identify landmarks and cultural sites
- **Audio Generation**: Creates personalized audio tour guides in multiple languages
- **Multi-language Support**: English and Spanish audio guides
- **Responsive Design**: Works on both mobile and desktop devices
- **No Database Required**: Works completely offline with built-in cultural site data

## Prerequisites

- Node.js 18+ and npm/pnpm
- Google Cloud Vision API credentials
- Next.js 15+

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Google Cloud Vision API Configuration
GCP_PROJECT_ID=your_gcp_project_id
GCP_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GCP_PRIVATE_KEY=your_private_key
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cultural-tourism-app
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up your Google Cloud Vision API credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Vision API
   - Create a service account and download the JSON key file
   - Add the credentials to your `.env.local` file

4. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Image Upload/Capture**: Users can take photos or upload images
2. **Image Analysis**: Google Cloud Vision API analyzes the image for landmarks and objects
3. **Site Recognition**: The app matches recognized landmarks with built-in cultural site data
4. **Content Generation**: Creates personalized audio scripts based on the site information
5. **Audio Generation**: Converts the script to audio (currently mock TTS for development)
6. **Audio Playback**: Users can listen to the generated audio guide

## Built-in Cultural Sites

The app includes information about major cultural sites:
- Colosseum (Rome, Italy)
- Eiffel Tower (Paris, France)
- Mona Lisa (Paris, France)
- Neuschwanstein Castle (Germany)
- Big Ben (London, England)
- Sagrada Familia (Barcelona, Spain)

## API Endpoints

- `/api/recognize` - Image recognition using Google Cloud Vision
- `/api/generate-content` - Generates audio script content
- `/api/generate-audio` - Converts text to speech (currently mock)

## Customization

### Adding New Cultural Sites

To add new cultural sites, edit the `MOCK_CULTURAL_SITES` object in `app/api/recognize/route.ts`:

```typescript
const MOCK_CULTURAL_SITES = {
  "your-site-name": {
    id: "unique-id",
    name: "Site Name",
    location: "City, Country",
    description: "Description of the site",
    historical_period: "When it was built",
    cultural_significance: "Why it's important"
  }
  // ... more sites
};
```

### Replacing Mock TTS

To use a real text-to-speech service, replace the `mockTextToSpeech` function in `app/api/generate-audio/route.ts` with calls to:
- ElevenLabs API
- Google Text-to-Speech
- Amazon Polly
- Microsoft Azure Speech Service

## Troubleshooting

### Common Issues

1. **"Vision API error"**
   - Verify Google Cloud Vision API credentials
   - Check that the API is enabled in your GCP project
   - Ensure the service account has the necessary permissions

2. **Audio generation fails**
   - The app currently uses mock TTS for development
   - For production, integrate with a real TTS service

3. **Image recognition not working**
   - Ensure the image contains recognizable landmarks
   - Check that the image format is supported (JPEG, PNG)
   - Verify Google Cloud Vision API is working

### Development Mode

The app includes several fallbacks for development:
- Mock TTS service when audio generation fails
- Built-in cultural site data (no database required)
- Graceful error handling

## Production Deployment

1. Set up proper environment variables in your hosting platform
2. Replace mock TTS with a real service (ElevenLabs, Google TTS, etc.)
3. Set up proper monitoring and error tracking
4. Configure CDN for static assets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
