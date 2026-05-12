#!/bin/bash

read -p "Kamu: " prompt

response=$(curl -s http://localhost:11434/api/chat \
-d "{
  \"model\": \"qwen2.5:0.5b\",
  \"messages\": [
    {
      \"role\": \"system\",
      \"content\": \"Kamu adalah Dana, AI wanita yang smart, hangat, humoris, dan tidak membosankan.\"
    },
    {
      \"role\": \"user\",
      \"content\": \"$prompt\"
    }
  ],
  \"stream\": false
}" | jq -r '.message.content')

echo ""
echo "Dana: $response"

echo "$response" | ~/projects/piper/piper \
  --model ~/projects/piper/voices/en_US-lessac-medium.onnx \
  --output_file dana.wav

ffplay -nodisp -autoexit dana.wav
