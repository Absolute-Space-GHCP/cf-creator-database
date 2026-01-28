#!/usr/bin/env python3
"""
File: convert_chats.py
Version: 1.0.0-clean
Date: 2026-01-28
Repo: ai-agents-gmaster-build

Convert VS Code Copilot chat JSON files to readable transcripts
"""

import json
import os
from pathlib import Path
from datetime import datetime

def extract_text(part):
    """Extract text from a message part"""
    if isinstance(part, dict):
        return part.get('text', '')
    return str(part)

def convert_chat_to_markdown(json_file):
    """Convert a single chat JSON file to markdown"""
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {json_file}: {e}")
        return None
    
    # Extract metadata
    requester = data.get('requesterUsername', 'User')
    responder = data.get('responderUsername', 'Assistant')
    timestamp = data.get('lastMessageDate', 0)
    if timestamp:
        date_str = datetime.fromtimestamp(timestamp / 1000).strftime('%Y-%m-%d %H:%M:%S')
    else:
        date_str = 'Unknown'
    
    title = data.get('customTitle', 'Chat Session')
    
    # Build markdown
    markdown = f"# {title}\n\n"
    markdown += f"**Date:** {date_str}\n"
    markdown += f"**Participants:** {requester} & {responder}\n\n"
    markdown += "---\n\n"
    
    # Process requests/responses
    requests = data.get('requests', [])
    for i, req in enumerate(requests, 1):
        # User message
        message = req.get('message', {})
        if message:
            parts = message.get('parts', [])
            user_text = ''.join(extract_text(part) for part in parts)
            if user_text.strip():
                markdown += f"## Message {i}\n\n"
                markdown += f"**{requester}:**\n\n{user_text}\n\n"
        
        # Assistant response
        responses = req.get('response', [])
        response_text = ''
        for resp in responses:
            if isinstance(resp, dict):
                if 'value' in resp:
                    response_text += resp['value']
        
        if response_text.strip():
            markdown += f"**{responder}:**\n\n{response_text}\n\n"
        
        markdown += "---\n\n"
    
    return markdown

def main():
    chat_dir = Path('chat-history-export')
    
    if not chat_dir.exists():
        print(f"Error: {chat_dir} not found")
        return
    
    # Create output directory
    output_dir = Path('chat-transcripts')
    output_dir.mkdir(exist_ok=True)
    
    # Process each JSON file
    json_files = sorted(chat_dir.glob('*.json'), key=lambda x: x.stat().st_mtime, reverse=True)
    
    if not json_files:
        print(f"No JSON files found in {chat_dir}")
        return
    
    print(f"Found {len(json_files)} chat files. Converting...\n")
    
    for json_file in json_files:
        print(f"Processing: {json_file.name}")
        markdown = convert_chat_to_markdown(json_file)
        
        if markdown:
            # Create output filename
            output_file = output_dir / f"{json_file.stem}.md"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(markdown)
            print(f"  ✓ Saved to: {output_file}")
        else:
            print(f"  ✗ Failed to convert")
    
    print(f"\n✓ All chats converted! Check the 'chat-transcripts' folder.")

if __name__ == '__main__':
    main()
