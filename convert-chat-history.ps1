# Convert Copilot chat JSON files to readable text transcripts
param(
    [string]$SourceDir = "C:\Users\cmsch\OneDrive\Desktop\jlai-gm-v3-backup-20251126\chat-history-export",
    [string]$OutputDir = "C:\Users\cmsch\OneDrive\Desktop\jlai-gm-v3-backup-20251126\chat-transcripts"
)

# Create output directory if it doesn't exist
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Get all JSON files
$files = Get-ChildItem -Path $SourceDir -Filter "*.json"

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw | ConvertFrom-Json
        
        # Extract key information
        $title = $content.customTitle -replace '[\\/:*?"<>|]', '_'
        if (!$title) { $title = $file.BaseName }
        
        $outputFile = Join-Path $OutputDir "$title.txt"
        $transcript = @()
        
        # Add header
        $transcript += "=" * 80
        $transcript += "CHAT TRANSCRIPT"
        $transcript += "=" * 80
        $transcript += "Title: $($content.customTitle)"
        $transcript += "Date: $(([datetime]$content.creationDate / 1000).ToString('g'))"
        $transcript += "Last Updated: $(([datetime]$content.lastMessageDate / 1000).ToString('g'))"
        $transcript += "=" * 80
        $transcript += ""
        
        # Process each request/response pair
        foreach ($request in $content.requests) {
            # User message
            $transcript += "USER:"
            $userText = $request.message.text
            $transcript += $userText
            $transcript += ""
            
            # Assistant response
            $transcript += "ASSISTANT:"
            
            # Extract response text
            foreach ($response in $request.response) {
                if ($response.value) {
                    $transcript += $response.value
                }
            }
            
            $transcript += ""
            $transcript += "-" * 80
            $transcript += ""
        }
        
        # Write to file
        $transcript | Out-File -FilePath $outputFile -Encoding UTF8
        Write-Host "✓ Created: $outputFile"
    }
    catch {
        Write-Host "✗ Error processing $($file.Name): $_"
    }
}

Write-Host ""
Write-Host "Chat transcripts saved to: $OutputDir"
