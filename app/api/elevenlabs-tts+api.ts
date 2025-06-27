export async function POST(request: Request) {
  try {
    const { text, voiceId = 'pNInz6obpgDQGcFmaJgB', voice_settings } = await request.json();
    
    // Validate required fields
    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }
    
    const apiKey = 'sk_3b7193bfa31edeb218fadeb768858e208e4cf57c876d18a3';
    if (!apiKey) {
      return Response.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }

    // Optimized voice settings for soothing, comforting, non-robotic speech
    const defaultVoiceSettings = {
      stability: 0.71,           // Higher stability for smoother, less erratic speech
      similarity_boost: 0.5,     // Lower similarity for more natural variation
      style: 0.21,              // Slight style enhancement for warmth
      use_speaker_boost: true    // Enhanced clarity
    };

    const finalVoiceSettings = { ...defaultVoiceSettings, ...voice_settings };

    // Call ElevenLabs API with optimized settings
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: finalVoiceSettings,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      return Response.json(
        { error: 'Failed to generate speech' }, 
        { status: response.status }
      );
    }

    // Get the audio data as array buffer
    const audioBuffer = await response.arrayBuffer();

    // Return the audio data with proper headers
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}