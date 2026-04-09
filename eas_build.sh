#!/bin/bash

cd /workspaces/MaxMonk

# Auto-login if session expired
eas whoami &>/dev/null || eas login
echo "🚀 Pushing update..."
eas update --branch main --message "$msg"

echo "✅ Done! Open Expo Go → Projects to see changes."